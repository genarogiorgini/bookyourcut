import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { PublicBarber, PublicShop } from '@turnero/shared';
import { ApiService } from './api.service';

/** Holds the current shop + client booking selection across the wizard steps. */
@Injectable({ providedIn: 'root' })
export class ShopStore {
  private readonly api = inject(ApiService);

  readonly shop = signal<PublicShop | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedBarber = signal<PublicBarber | null>(null);

  async load(slug: string): Promise<PublicShop | null> {
    if (this.shop()?.slug === slug) return this.shop();
    this.loading.set(true);
    this.error.set(null);
    try {
      const shop = await firstValueFrom(this.api.getShop(slug));
      this.shop.set(shop);
      this.applyAccent(shop.primaryColor);
      return shop;
    } catch {
      this.error.set('No pudimos cargar la barbería.');
      this.shop.set(null);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  selectBarber(barber: PublicBarber): void {
    this.selectedBarber.set(barber);
  }

  private applyAccent(color: string | null): void {
    if (color) {
      document.documentElement.style.setProperty('--accent', color);
    }
  }
}
