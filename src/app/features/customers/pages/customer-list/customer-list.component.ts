import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DataLoaderService, CustomerStateService, Customer } from '@core/index';
import { CardComponent, EmptyStateComponent, SkeletonComponent } from '@shared/index';

/**
 * Customer List Component - Display and select customers
 */
@Component({
  selector: 'app-customer-list',
  imports: [CardComponent, EmptyStateComponent, SkeletonComponent],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css'
})
export class CustomerListComponent implements OnInit {
  readonly dataLoader = inject(DataLoaderService);
  readonly customerState = inject(CustomerStateService);
  private readonly router = inject(Router);

  readonly searchQuery = signal('');

  readonly filteredCustomers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const customers = this.dataLoader.customers();
    
    if (!query) return customers;
    
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );
  });

  ngOnInit(): void {
    this.dataLoader.loadAllData();
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  selectCustomer(customer: Customer): void {
    this.customerState.selectCustomer(customer.id);
    this.router.navigate(['/accounts']);
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
