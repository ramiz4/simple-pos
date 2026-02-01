import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeedService } from './application/services/seed.service';
import { EnumMappingService } from './application/services/enum-mapping.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('simple-bistro-pos');
  private seedService = inject(SeedService);
  private enumMappingService = inject(EnumMappingService);

  async ngOnInit() {
    await this.seedService.seedDatabase();
    await this.enumMappingService.init();
  }
}
