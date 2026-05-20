import { Component, OnInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit {
  constructor(private themeService: ThemeService) {
    // Reactively apply data-theme attribute whenever the signal changes
    effect(() => {
      const theme = this.themeService.theme();
      document.documentElement.setAttribute('data-theme', theme);
    });
  }

  ngOnInit(): void {
    // Ensure the initial persisted theme is applied immediately
    document.documentElement.setAttribute('data-theme', this.themeService.theme());
  }
}
