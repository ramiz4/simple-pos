# Tauri Signing Keys Setup

This project uses **cryptographic signing** to ensure app updates are authentic and haven't been tampered with.

## 🔐 Security Model

- **Private Key** (`tauri.key`) - Kept secret, used to sign releases
- **Public Key** (`tauri.key.pub`) - Committed to repo, used by apps to verify updates
- Public key is also embedded in `src-tauri/tauri.conf.json`

## 📋 Setup Instructions

### 1. Local Development

The signing keys are already generated and stored in:

- `src-tauri/tauri.key` (git-ignored, never commit this!)
- `src-tauri/tauri.key.pub` (committed to repo)

For local builds, Tauri automatically uses these files. No additional setup needed.

### 2. GitHub Actions Setup

To enable signed releases in CI/CD, you need to add the private key as a GitHub Secret:

#### Step-by-Step:

1. **Copy the private key content:**

   ```bash
   cat src-tauri/tauri.key
   ```

   Copy the entire output (it's a long base64 string).

2. **Go to GitHub Repository Settings:**
   - Navigate to: `https://github.com/ramiz4/simple-pos/settings/secrets/actions`
   - Or: Repository → Settings → Secrets and variables → Actions

3. **Create the private key secret:**
   - Click **"New repository secret"**
   - Name: `TAURI_SIGNING_PRIVATE_KEY`
   - Value: Paste the content from step 1
   - Click **"Add secret"**

4. **Verify the workflow:**
   - The `.github/workflows/release.yml` file is already configured to use both secrets
   - When you push a tag (e.g., `v1.0.0`), the release will be automatically signed

## 🔄 Regenerating Keys

If you need to regenerate the signing keys (e.g., if compromised):

```bash
# Generate new keys WITH password (recommended for security)
pnpm tauri signer generate -w src-tauri/tauri.key --force
# You'll be prompted to enter a password - use a strong one!
```

After regenerating:

1. Update the public key in `tauri.conf.json` (copy from the command output)
2. Update the `TAURI_SIGNING_PRIVATE_KEY` GitHub Secret with the new private key content
3. ⚠️ **Important:** Users on old versions won't be able to update automatically. They'll need to download the new version manually.

## ⚠️ Important Notes

- **Never commit `tauri.key`** - It's in `.gitignore` for a reason
- **Backup your keys** - Store them securely (password manager, encrypted backup)
- **Losing the private key** means you can't sign updates anymore
- **Public key changes** break automatic updates for existing users
