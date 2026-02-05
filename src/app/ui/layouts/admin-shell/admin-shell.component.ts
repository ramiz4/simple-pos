import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, mergeMap, take } from 'rxjs/operators';
import { AdminPageHeaderComponent } from '../../components/admin/page-header/page-header.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminPageHeaderComponent],
  template: `
    <div class="min-h-screen bg-linear-to-br from-purple-50 to-blue-50">
      <app-admin-page-header [title]="title()" [subtitle]="subtitle()"></app-admin-page-header>
      <router-outlet></router-outlet>
    </div>
  `,
})
export class AdminShellComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  title = signal('');
  subtitle = signal('');

  constructor() {
    // Listen for future navigation events
    // Setup in constructor to satisfy takeUntilDestroyed injection context
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap((route) => route.data),
        takeUntilDestroyed(),
      )
      .subscribe((data) => this.updateHeader(data));
  }

  ngOnInit() {
    // Handle initial state manually as NavigationEnd already happened
    let currentRoute = this.activatedRoute;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }
    // We only need the first emission for the initial load
    currentRoute.data.pipe(take(1)).subscribe((data) => this.updateHeader(data));
  }

  private updateHeader(data: any) {
    this.title.set(data['title'] || 'Admin Portal');
    this.subtitle.set(data['subtitle'] || '');
  }
}
