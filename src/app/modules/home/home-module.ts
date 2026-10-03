import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing-module';
import { MatButton } from '@angular/material/button';

@NgModule({
  declarations: [],
  imports: [CommonModule, HomeRoutingModule, MatButton],
})
export class HomeModule {}
