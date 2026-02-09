import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-admin-nav-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <li>
      @if (item.children) {
        <div class="mb-2">
          <p
            class="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-4 first:mt-0"
          >
            {{ item.label }}
          </p>
          <ul class="space-y-1 mt-1 font-medium">
            @for (child of item.children; track child.path) {
              <ng-container
                *ngTemplateOutlet="navLink; context: { $implicit: child }"
              ></ng-container>
            }
          </ul>
        </div>
      } @else {
        <ng-container *ngTemplateOutlet="navLink; context: { $implicit: item }"></ng-container>
      }

      <ng-template #navLink let-link>
        <a
          [routerLink]="link.path"
          [routerLinkActive]="activeClasses"
          [routerLinkActiveOptions]="{ exact: link.path === '/admin' }"
          class="flex items-center p-3 text-gray-600 rounded-2xl group transition-all duration-300 hover:bg-white/60 hover:text-purple-600 hover:shadow-sm border border-transparent hover:border-white/40 active:scale-95 mx-2"
          (click)="onLinkClick()"
        >
          @if (link.icon) {
            <span
              class="shrink-0 w-5 h-5 transition duration-75 group-hover:text-purple-600 group-[.active-nav-item]:group-hover:text-white"
              [innerHTML]="getIcon(link.icon)"
            ></span>
          } @else {
            <!-- Default bullet icon if no icon provided -->
            <span class="shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-40 mx-2"></span>
          }
          <span class="ms-3 text-sm font-bold tracking-tight">{{ link.label }}</span>
        </a>
      </ng-template>
    </li>
  `,
})
export class AdminNavItemComponent {
  @Input({ required: true }) item!: NavItem;
  @Input() onLinkClick: () => void = () => {
    /* Optional click handler */
  };

  activeClasses =
    'bg-linear-to-r from-purple-600 to-blue-600 text-white hover:!text-white active-nav-item shadow-lg shadow-purple-200/50 scale-[1.02] border-white/20';

  getIcon(icon: string): string {
    // Basic icons mapping
    const icons: Record<string, string> = {
      dashboard: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>`,
      menu: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.007 5.25H3.75V12h.008v.008Zm0 5.25H3.75v-.008h.008v.008Z" /></svg>`,
      tools: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.423 20.25a9.003 9.003 0 0 1-7.903-4.906 5.923 5.923 0 0 1 1.632-6.992l.011-.011a6.019 6.019 0 0 1 8.509 0l.01.01a6.022 6.022 0 0 1 1.633 6.992 9.003 9.003 0 0 1-7.903 4.906Zm0 0-7.086-7.086m0 0a2 2 0 1 1 2.828-2.828l7.086 7.086m-7.086-7.086-1.06-1.06m7.086 7.086 1.06 1.06m-2.121-2.121 1.061 1.061m-10.606-10.606 1.06-1.06m7.087 7.087-1.061-1.061M12 12V4.5m0 0L15.75 8.25M12 4.5l-3.75 3.75" /></svg>`,
      settings: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.127c-.332.183-.582.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`,
      back: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>`,
    };
    return icons[icon] || '';
  }
}
