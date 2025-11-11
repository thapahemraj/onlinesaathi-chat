import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import {
  LucideAngularModule,
  Shield,
  PanelLeft,
  NotebookPen,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bot,
  Sun,
  Moon,
  Video,
  Phone,
  X,
  Plus,
  Smile,
  Send
} from 'lucide-angular';

bootstrapApplication(App, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideHttpClient(),
    importProvidersFrom(
      LucideAngularModule.pick({
        Shield,
        PanelLeft,
        NotebookPen,
        Search,
        ChevronLeft,
        ChevronRight,
        ChevronDown,
        Bot,
        Sun,
        Moon,
        Video,
        Phone,
        X,
        Plus,
        Smile,
        Send
      })
    )
  ]
}).catch(err => console.error(err));
