// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};
use log::LevelFilter;

#[tauri::command]
async fn print_raw(connection: String, data: Vec<u8>) -> Result<(), String> {
    if connection.starts_with("tcp:") {
        let addr = connection.trim_start_matches("tcp:").to_string();
        use std::net::TcpStream;
        use std::io::Write;
        use std::time::Duration;

        let mut stream = TcpStream::connect_timeout(
            &addr.parse().map_err(|e| format!("Invalid address: {}", e))?,
            Duration::from_secs(5)
        ).map_err(|e| format!("Failed to connect: {}", e))?;

        stream.write_all(&data).map_err(|e| format!("Failed to write: {}", e))?;
        stream.flush().map_err(|e| format!("Failed to flush: {}", e))?;
        Ok(())
    } else {
        // Fallback or other connection types (USB, Serial, Local)
        // For now, we only implement TCP for network printers
        Err(format!("Unsupported connection type: {}", connection))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create initial tables",
            sql: include_str!("../migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "complete schema",
            sql: include_str!("../migrations/002_complete_schema.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            SqlBuilder::new()
                .add_migrations("sqlite:simple-pos.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(LevelFilter::Info)
                .level_for("tao", LevelFilter::Error)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .max_file_size(10_000_000) // 10MB
                .build(),
        )
        .invoke_handler(tauri::generate_handler![print_raw])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
