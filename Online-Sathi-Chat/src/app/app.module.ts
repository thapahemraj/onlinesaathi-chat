import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JwtModule } from '@auth0/angular-jwt';
import { ToastrModule } from 'ngx-toastr';

import { AppComponent } from './app.component';
import { ChatComponent } from './chat/chat.component';
import { AuthService } from './_services/auth.service';
import { ChatService } from './_services/chat.service';
import { AuthInterceptor } from './_helpers/auth.interceptor';

// Function to get the JWT token from local storage
export function tokenGetter() {
  return localStorage.getItem('token');
}

@NgModule({
  declarations: [
    AppComponent,
    ChatComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
    }),
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ['localhost:5001'],
        disallowedRoutes: []
      }
    })
  ],
  providers: [
    AuthService,
    ChatService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
