import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VotacionesRoutingModule } from './votaciones-routing-module';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [],
  imports: [CommonModule, VotacionesRoutingModule, MatButtonModule, MatIconModule],
})
export class VotacionesModule {}
