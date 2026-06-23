import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { PostRecord } from '../postrecord.model';
import {CommonModule} from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-delete-post',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './delete-post.html',
  styleUrl: './delete-post.css',

})
export class DeletePost {
  dialogRef: MatDialogRef<DeletePost>;
  deletePostForm: FormGroup;
  http: HttpClient;
  serverData!: Object | null;
  serverDataArr!: any
  message: string = "";
//@inject: grab data was passed into this dialog when it was opened.
// CHnage detectorref: detect changes in the component.
  constructor(dialogRef: MatDialogRef<DeletePost>, fb: FormBuilder, http: HttpClient, @Inject(MAT_DIALOG_DATA) public data: PostRecord,
              private cdr: ChangeDetectorRef)  {
    this.http = http;
    this.dialogRef = dialogRef;
    // Form Bulider
    this.deletePostForm = fb.group({
      'id': ['', Validators.required]
    });
  }

  deleteRecord(id: number): void {
    this.serverData = null;
    let url = '/mobilepost/' + id;

    console.log("Deleting ID:", id);
    console.log("URL:", url);

    this.http.delete(url).subscribe({
      next: (res) => {
        console.log(res);
        this.message = "Record " + id + " deleted. Please  Search again to update the list.";
        this.cdr.detectChanges(); // ensure the message is updated in the UI
        this.serverDataArr = JSON.parse(JSON.stringify(res));
        // keep the success message visible briefly before closing
        setTimeout(() => this.dialogRef.close(), 1500);
      },
      error: (err) => {
        // improved error handling for test report
        if (err && err.status === 0) {
          this.message = "Cannot delete. Is the server running?";
        } else if (err && err.status === 404) {
          this.message = "Record not found.";
        } else {
          this.message = "Error: " + (err?.message || err?.statusText || 'Unknown error');
        }
        console.log(err);
      }
    });
  }

  confirmDelete(): void {
    this.deleteRecord(this.data.id);
  }
  closeModal(): void {
    this.dialogRef.close(); // cancel button — close without deleting
  }
}

