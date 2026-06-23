import { Component, ChangeDetectorRef } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PostRecord } from '../postrecord.model';
import {CommonModule} from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';

// handles post(create record) request
@Component({
  selector: 'app-create-post',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-post.html',
  styleUrl: './create-post.css',
})
export class CreatePost {
  dialogRef: MatDialogRef<CreatePost>;
  createPostForm: FormGroup;
  http: HttpClient;
  cdr: ChangeDetectorRef;
  serverData!: Object | null;
  serverDataArr!: any;
  message: string = 'Create record here.'
//build a form.
  constructor(dialogRef: MatDialogRef<CreatePost>, fb: FormBuilder, http: HttpClient, cdr: ChangeDetectorRef)  {
    this.http = http;
    this.dialogRef = dialogRef;
    this.cdr = cdr;
// enter essenial data for creating a data
    this.createPostForm = fb.group({
      'mobileCode': ['', Validators.required],
      'dayOfWeekCode': ['', Validators.required],
      'seq': ['', Validators.required],
      'districtEN': [''],
      'nameEN': [''],
      'addressEN': [''],
      'nameTC': [''],
      'openHour': [''],
      'closeHour': [''],

    });

  }
  // void aka do something, but return nothing
  createRecord(formValue: any): void {
    this.serverData = null;
    let url = '/mobilepost';

    console.log("Creating new post...");
    console.log("URL:", url);

    this.http.post(url, formValue).subscribe({
      next: (res) => {
        console.log(res); // check exact response shape
        const newId = (res as any)?.id || (res as any)?.data?.id || '?';
        this.message = "Record " + newId + " created successfully!";
        this.cdr.detectChanges();
        setTimeout(() => this.dialogRef.close(), 2500);
      },

      error: (err) => {
        // improved error handling for test report
        if (err && err.status === 0) {
          this.message = "Cannot connect to server. Is it running?";
        } else if (err && err.status === 404) {
          this.message = "Record not found.";
        } else {
          this.message = "Error: " + (err?.message || err?.statusText || 'Unknown error');
        }
        console.log(err);
      }
    });

  }

  closeModal(): void {
    this.dialogRef.close();
  }
}



