import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonComponent } from '../../components/shared/button/button.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  currentYear = new Date().getFullYear();
  features = [
    {
      title: 'Swift & Modern POS',
      description:
        'Experience a lightning-fast interface designed for maximum efficiency in high-pace environments.',
      icon: '⚡',
    },
    {
      title: 'Offline-First Design',
      description:
        'Your business never stops. Continue processing orders even when the internet goes down.',
      icon: '📶',
    },
    {
      title: 'Real-time Analytics',
      description: 'Stay ahead with live insights into your revenue, top products, and peak hours.',
      icon: '📊',
    },
    {
      title: 'Kitchen Sync',
      description:
        'Seamless communication between front-of-house and kitchen staff for perfect execution.',
      icon: '🍳',
    },
  ];
}
