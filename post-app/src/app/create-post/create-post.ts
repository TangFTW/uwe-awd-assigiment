import { Component, signal, output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-create-post',
  imports: [FormsModule],
  templateUrl: './create-post.html',
  styleUrl: './create-post.css',
})
export class CreatePost {
  private http = inject(HttpClient);
  
  // Output event to close modal
  closeModal = output();
  
  loading = signal(false);
  error = signal('');
  message = signal('');
  createdId = signal<number | null>(null);
  
  form = {
    mobileCode: '',
    dayOfWeekCode: null as number | null,
    seq: null as number | null,
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
    latitude: null as number | null,
    longitude: null as number | null
  };

  close() {
    this.closeModal.emit();
  }

  reset() {
    this.form = {
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
      longitude: null
    };
    this.error.set('');
    this.message.set('');
    this.createdId.set(null);
  }

  submit() {
    this.error.set('');
    this.message.set('');
    this.createdId.set(null);
    
    // Validate required fields
    if (!this.form.mobileCode || !this.form.dayOfWeekCode || this.form.seq === null ||
        !this.form.districtEN || !this.form.locationEN || !this.form.addressEN ||
        !this.form.openHour || !this.form.closeHour) {
      this.error.set('Please fill in all required fields');
      return;
    }

    this.loading.set(true);

    // Call POST /mobilepost
    this.http.post<any>('/mobilepost', this.form).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.message.set('Record created successfully!');
          this.createdId.set(response.id);
          // Reset form after success
          setTimeout(() => this.reset(), 2000);
        } else {
          this.error.set(response.errmsg || 'Failed to create record');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.errmsg || err.message || 'Failed to create record');
      }
    });
  }
}
