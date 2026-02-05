import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
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

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap((route) => route.data),
      )
      .subscribe((data) => {
        this.title.set(data['title'] || 'Admin Portal');
        this.subtitle.set(data['subtitle'] || '');
      });
  }
}
