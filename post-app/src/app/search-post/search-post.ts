import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { UpdatePost } from '../update-post/update-post';

@Component({
  selector: 'app-search-post',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, UpdatePost],
  templateUrl: './search-post.html',
  styleUrls: ['./search-post.css']
})
export class SearchPost implements OnInit {
  private http = inject(HttpClient);
  
  // Input from parent to set initial search mode
  initialMode = input<string>('district');
  
  // Output event to close modal
  closeModal = output();
  
  // Data for the Table
  posts: any[] = [];
  searched: boolean = false;
  
  // Update modal state
  showUpdateModal = signal(false);
  selectedPost = signal<any>(null);
  
  // Search Inputs
  districtInput: string = '';
  locationInput: string = '';
  dayInput: number | null = null;
  addressInput: string = '';
  
  // Current search mode
  searchMode: string = 'district';

  ngOnInit() {
    // Set initial search mode from parent
    this.searchMode = this.initialMode();
  }

  close() {
    this.closeModal.emit();
  }

  // The Search Function
  onSearch() {
    let params = new HttpParams();
    
    // Add params based on search mode
    if (this.searchMode === 'district' && this.districtInput) {
      params = params.set('districtEN', this.districtInput);
    }
    if (this.searchMode === 'location' && this.locationInput) {
      params = params.set('locationEN', this.locationInput);
    }
    if (this.searchMode === 'day' && this.dayInput) {
      params = params.set('dayOfWeekCode', this.dayInput.toString());
    }
    if (this.searchMode === 'address' && this.addressInput) {
      params = params.set('addressEN', this.addressInput);
    }

    // Call your Server (use proxy)
    this.http.get<any>('/mobilepost', { params })
      .subscribe({
        next: (response) => {
          this.posts = response.data || []; 
          this.searched = true;
          console.log('Found records:', this.posts.length);
        },
        error: (err) => {
          console.error('Search failed', err);
          alert('Error searching records');
          this.searched = true;
        }
      });
  }
  
  // Delete Function
  onDelete(id: number) {
    if (!confirm(`Are you sure you want to delete record ID ${id}?`)) {
      return;
    }

    this.http.delete<any>(`/mobilepost/${id}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            alert('Record deleted successfully!');
            // Remove from current results
            this.posts = this.posts.filter(p => p.id !== id);
          }
        },
        error: (err) => {
          console.error('Delete failed', err);
          alert(err?.error?.errmsg || 'Failed to delete record');
        }
      });
  }
  
  // Edit Function
  onEdit(post: any) {
    this.selectedPost.set(post);
    this.showUpdateModal.set(true);
  }
  
  // Close Update Modal
  closeUpdateModal() {
    this.showUpdateModal.set(false);
    this.selectedPost.set(null);
    // Optionally refresh search results
    this.onSearch();
  }
}
