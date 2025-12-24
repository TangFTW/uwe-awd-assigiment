import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CreatePost } from './create-post/create-post';
import { SearchPost } from './search-post/search-post';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, CreatePost, SearchPost],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private http = inject(HttpClient);
  
  protected readonly title = signal('testpage');
  loading = signal(false);
  message = signal('');
  results = signal<any[]>([]);
  showCreateForm = signal(false);
  showSearchForm = signal(false);
  searchMode = signal('district');
  
  searchDistrict = '';
  searchDay: number | null = null;

  openCreateForm() {
    this.showCreateForm.set(true);
  }

  closeCreateForm() {
    this.showCreateForm.set(false);
  }

  openSearchForm(mode: string = 'district') {
    this.searchMode.set(mode);
    this.showSearchForm.set(true);
  }

  closeSearchForm() {
    this.showSearchForm.set(false);
  }

  pingServer() {
    this.loading.set(true);
    this.message.set('Pinging server...');

    // Uses Angular dev-server proxy: /mobilepost -> http://localhost:3001/mobilepost
    this.http.get<any>('/mobilepost').subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          const rows = Array.isArray(response.data) ? response.data : [];
          this.message.set(`Connected. Loaded ${rows.length} record(s).`);
          this.results.set(rows);
        } else {
          this.message.set('Server error: ' + (response.errmsg || 'Unknown error'));
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.message.set('Connection failed: ' + (err?.error?.errmsg || err.message || 'Cannot reach server'));
      }
    });
  }

  searchDistrict_() {
    if (!this.searchDistrict) {
      this.message.set('Please enter a district');
      return;
    }
    
    this.loading.set(true);
    this.message.set('Searching...');
    
    const district = encodeURIComponent(this.searchDistrict.trim());
    this.http.get<any>(`/mobilepost/search?districtEN=${district}`).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          const rows = Array.isArray(response.data) ? response.data : [];
          this.message.set(`Found ${rows.length} record(s).`);
          this.results.set(rows);
        } else {
          this.message.set(response.errmsg || 'Search failed');
          this.results.set([]);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.message.set('Search failed: ' + (err?.error?.errmsg || err.message || 'Unknown error'));
        this.results.set([]);
      }
    });
  }

  searchDay_() {
    if (!this.searchDay || this.searchDay < 1 || this.searchDay > 7) {
      this.message.set('Please enter a day (1-7)');
      return;
    }
    
    this.loading.set(true);
    this.message.set('Searching...');
    
    this.http.get<any>(`/mobilepost/search?dayOfWeekCode=${this.searchDay}`).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          const rows = Array.isArray(response.data) ? response.data : [];
          this.message.set(`Found ${rows.length} record(s).`);
          this.results.set(rows);
        } else {
          this.message.set(response.errmsg || 'Search failed');
          this.results.set([]);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.message.set('Search failed: ' + (err?.error?.errmsg || err.message || 'Unknown error'));
        this.results.set([]);
      }
    });
  }
}
