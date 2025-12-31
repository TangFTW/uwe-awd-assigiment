import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-update-post',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './update-post.html',
  styleUrl: './update-post.css',
})
export class UpdatePost implements OnInit {
  private http = inject(HttpClient);
  
  // Input from parent - the post data to edit
  postData = input<any>(null);
  
  // Output event to close modal
  closeModal = output();
  
  // Form model
  form: any = {
    mobileCode: '',
    dayOfWeekCode: null,
    seq: null,
    nameEN: '',
    nameTC: '',
    nameSC: '',
    districtEN: '',
    districtTC: '',
    districtSC: '',
    locationEN: '',
    locationTC: '',
    locationSC: '',
    addressEN: '',
    addressTC: '',
    addressSC: '',
    openHour: '',
    closeHour: '',
    latitude: null,
    longitude: null,
    remarks: ''
  };
  
  loading = false;

  ngOnInit() {
    // Load the post data into the form
    const post = this.postData();
    if (post) {
      this.form = { ...post };
    }
  }

  close() {
    this.closeModal.emit();
  }

  submit() {
    const post = this.postData();
    if (!post || !post.id) {
      alert('No record to update');
      return;
    }

    this.loading = true;
    
    // Prepare data and trim time format from HH:MM:SS to HH:MM
    const formData = { ...this.form };
    if (formData.openHour && formData.openHour.length > 5) {
      formData.openHour = formData.openHour.substring(0, 5);
    }
    if (formData.closeHour && formData.closeHour.length > 5) {
      formData.closeHour = formData.closeHour.substring(0, 5);
    }
    
    this.http.put<any>(`/mobilepost/${post.id}`, formData)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            alert('Record updated successfully!');
            this.close();
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Update failed', err);
          alert(err?.error?.errmsg || 'Failed to update record');
        }
      });
  }
}
