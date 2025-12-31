import { Component, inject, output, input, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-delete-post',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './delete-post.html',
  styleUrl: './delete-post.css',
})
export class DeletePost implements OnInit {
  private http = inject(HttpClient);

  // Input to receive prefilled record from search
  prefilledRecord = input<any>(null);

  // Output event to close modal
  closeModal = output();

  // Data for the Table
  posts: any[] = [];
  searched: boolean = false;

  // Search Inputs
  districtInput: string = '';
  locationInput: string = '';
  dayInput: number | null = null;
  addressInput: string = '';
  mobileCodeInput: string = '';
  idInput: number | null = null;

  searchMode: string = 'id';


  showConfirmModal: boolean = false;
  recordToDelete: any = null;

  // Selected record for detail view
  selectedRecord: any = null;

  constructor() {
    // React to prefilled record changes
    effect(() => {
      const record = this.prefilledRecord();
      if (record) {
        this.loadPrefilledRecord(record);
      }
    });
  }

  ngOnInit() {
    // Check for prefilled record on initialization
    const record = this.prefilledRecord();
    if (record) {
      this.loadPrefilledRecord(record);
    }
  }

  // Load prefilled record into search results
  loadPrefilledRecord(record: any) {
    // Set the record in posts array for immediate display
    this.posts = [record];
    this.searched = true;
    this.selectedRecord = record;

    // Also set search mode to ID and populate the ID field
    this.searchMode = 'id';
    this.idInput = record.id;
  }

  close() {
    this.closeModal.emit();
  }

  // reset the form
  clearSelection() {
    this.posts = [];
    this.searched = false;
    this.selectedRecord = null;
    this.idInput = null;
    this.districtInput = '';
    this.locationInput = '';
    this.dayInput = null;
    this.addressInput = '';
    this.mobileCodeInput = '';
  }

  
  onSearch() {
    let params = new HttpParams();

    // Single-field search modes
    if (this.searchMode === 'id' && this.idInput) {
      params = params.set('id', this.idInput.toString());
    }
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
    if (this.searchMode === 'mobileCode' && this.mobileCodeInput) {
      params = params.set('mobileCode', this.mobileCodeInput);
    }

    
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

  // get day name from code
  getDayName(dayCode: number): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayCode - 1] || 'Unknown';
  }

  // Show confirmation modal
  showDeleteConfirmation(record: any) {
    this.recordToDelete = record;
    this.showConfirmModal = true;
  }

  // Cancel deletion
  cancelDelete() {
    this.showConfirmModal = false;
    this.recordToDelete = null;
  }

  // Confirm and delete
  confirmDelete() {
    if (!this.recordToDelete) return;

    const id = this.recordToDelete.id;
    this.http.delete<any>(`/mobilepost/${id}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Close confirmation modal first
            this.showConfirmModal = false;
            this.recordToDelete = null;
            
            alert('Record deleted successfully!');
            
            // Remove from current results
            this.posts = this.posts.filter(p => p.id !== id);
            this.selectedRecord = null;
            
            // Close the main delete window
            this.close();
          }
        },
        error: (err) => {
          console.error('Delete failed', err);
          alert(err?.error?.errmsg || 'Failed to delete record');
          this.showConfirmModal = false;
          this.recordToDelete = null;
        }
      });
  }

  // Delete Function (legacy - keeping for compatibility)
  onDelete(id: number, postDetails: string) {
    const record = this.posts.find(p => p.id === id);
    if (record) {
      // Set as selected record to show detail view
      this.selectedRecord = record;
      this.posts = [record];
      this.searchMode = 'id';
      this.idInput = record.id;
    }
  }
}
