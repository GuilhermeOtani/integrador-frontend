import { Component } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { Drawer, DrawerModule } from 'primeng/drawer';
import { RippleModule } from 'primeng/ripple';
import { StyleClass } from 'primeng/styleclass'; 
import { CommonModule } from '@angular/common';


@Component({
  standalone: true,
  selector: 'app-sidebar',
  imports: [AvatarModule, ButtonModule, DrawerModule, RippleModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  
})
export class Sidebar {
visible: boolean = false;
  drawerRef: any;
  reportsAberto: boolean = false;
  menuFavorites = false;
  menuReports = false;
  menuRevenue = false;
  menuApplication = false

   closeCallback(e: any): void {
        this.drawerRef.close(e);
}
}