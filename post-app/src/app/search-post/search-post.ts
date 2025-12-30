import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { UpdatePost } from '../update-post/update-post';
import { ViewPost } from '../view-post/view-post';

@Component({
  selector: 'app-search-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, UpdatePost, ViewPost],
  templateUrl: './search-post.html',
  styleUrls: ['./search-post.css']
})
export class SearchPost implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  
  // Input from parent to set initial search mode
  initialMode = input<string>('district');
  
  // Output event to close modal
  closeModal = output();
  
  // Output event to open delete form with pre-filled data
  openDeleteWithData = output<any>();
  
  // Data for the Table
  posts: any[] = [];
  searched: boolean = false;
  
  // Modal states
  showViewModal = signal(false);
  showUpdateModal = signal(false);
  selectedPost = signal<any>(null);
  
  // Reactive Form
  searchForm!: FormGroup;
  
  // Current search mode
  searchMode: string = 'district';

  ngOnInit() {
    // Set initial search mode from parent
    this.searchMode = this.initialMode();
    
    // Initialize reactive form
    this.searchForm = this.fb.group({
      districtInput: [''],
      locationInput: [''],
      dayInput: [null],
      addressInput: [''],
      mobileCodeInput: [''],
      openAtInput: ['']
    });
  }

  close() {
    this.closeModal.emit();
  }

  // The Search Function
  onSearch() {
    let params = new HttpParams();
    
    const formValues = this.searchForm.value;
    
    // For advanced search, add all filled fields
    if (this.searchMode === 'advanced') {
      if (formValues.districtInput) {
        params = params.set('districtEN', formValues.districtInput);
      }
      if (formValues.locationInput) {
        params = params.set('locationEN', formValues.locationInput);
      }
      if (formValues.addressInput) {
        params = params.set('addressEN', formValues.addressInput);
      }
      if (formValues.dayInput) {
        params = params.set('dayOfWeekCode', formValues.dayInput.toString());
      }
      if (formValues.mobileCodeInput) {
        params = params.set('mobileCode', formValues.mobileCodeInput);
      }
      if (formValues.openAtInput) {
        params = params.set('openAt', formValues.openAtInput);
      }
    } else {
      // Single-field search modes
      if (this.searchMode === 'district' && formValues.districtInput) {
        params = params.set('districtEN', formValues.districtInput);
      }
      if (this.searchMode === 'location' && formValues.locationInput) {
        params = params.set('locationEN', formValues.locationInput);
      }
      if (this.searchMode === 'day' && formValues.dayInput) {
        params = params.set('dayOfWeekCode', formValues.dayInput.toString());
      }
      if (this.searchMode === 'address' && formValues.addressInput) {
        params = params.set('addressEN', formValues.addressInput);
      }
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
  
  // Delete Function - redirect to delete form with data
  onDeleteRedirect(post: any) {
    // Emit the post data to parent component
    this.openDeleteWithData.emit(post);
    // Close the search modal
    this.closeModal.emit();
  }
  
  // View Function
  onView(post: any) {
    this.selectedPost.set(post);
    this.showViewModal.set(true);
  }
  
  // Close View Modal
  closeViewModal() {
    this.showViewModal.set(false);
    this.selectedPost.set(null);
  }
  
  // Edit from View Modal
  onEditFromView(post: any) {
    this.showViewModal.set(false);
    this.selectedPost.set(post);
    this.showUpdateModal.set(true);
  }
  
  // Delete from View Modal
  onDeleteFromView(post: any) {
    this.showViewModal.set(false);
    // Redirect to parent's delete component
    this.openDeleteWithData.emit(post);
    this.closeModal.emit();
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
