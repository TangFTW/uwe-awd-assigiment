import { Component, signal, output, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-post',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-post.html',
  styleUrl: './create-post.css',
})
export class CreatePost implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  
  // Output event to close modal
  closeModal = output();
  
  loading = signal(false);
  error = signal('');
  message = signal('');
  createdId = signal<number | null>(null);
  
  // Reactive Form Group
  form!: FormGroup;
  
  ngOnInit() {
    this.initializeForm();
  }
  
  private initializeForm() {
    this.form = this.fb.group({
      mobileCode: ['', [Validators.required, Validators.minLength(1)]],
      dayOfWeekCode: [null, [Validators.required, Validators.min(1), Validators.max(7)]],
      seq: [null, [Validators.required, Validators.min(1)]],
      nameEN: [''],
      nameTC: [''],
      nameSC: [''],
      districtEN: ['', [Validators.required, Validators.minLength(2)]],
      districtTC: [''],
      districtSC: [''],
      locationEN: ['', [Validators.required, Validators.minLength(2)]],
      locationTC: [''],
      locationSC: [''],
      addressEN: ['', [Validators.required, Validators.minLength(5)]],
      addressTC: [''],
      addressSC: [''],
      openHour: ['', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      closeHour: ['', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      latitude: [null, [Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.min(-180), Validators.max(180)]]
    });
  }

  close() {
    this.closeModal.emit();
  }

  reset() {
    this.form.reset();
    this.error.set('');
    this.message.set('');
    this.createdId.set(null);
  }
  
  // Helper method to check if a field has errors and has been touched
  hasError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  // Get error message for a specific field
  getErrorMessage(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors) return '';
    
    if (field.errors['required']) return 'This field is required';
    if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength}`;
    if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
    if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
    if (field.errors['pattern']) return 'Invalid format (use HH:MM)';
    
    return 'Invalid value';
  }

  submit() {
    this.error.set('');
    this.message.set('');
    this.createdId.set(null);
    
    // Mark all fields as touched to show validation errors
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      this.error.set('Please fix all validation errors before submitting');
      return;
    }

    this.loading.set(true);

    // Prepare data and trim time format from HH:MM:SS to HH:MM
    const formData = { ...this.form.value };
    if (formData.openHour && formData.openHour.length > 5) {
      formData.openHour = formData.openHour.substring(0, 5);
    }
    if (formData.closeHour && formData.closeHour.length > 5) {
      formData.closeHour = formData.closeHour.substring(0, 5);
    }

    // Call POST /mobilepost
    this.http.post<any>('/mobilepost', formData).subscribe({
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
