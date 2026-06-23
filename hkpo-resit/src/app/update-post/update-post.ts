import { Component,Inject, ChangeDetectorRef  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {FormGroup, FormBuilder, Validators, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PostRecord } from '../postrecord.model';

@Component({
  selector: 'app-update-post',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-post.html',
  styleUrl: './update-post.css',
})
export class UpdatePost {
  dialogRef: MatDialogRef<UpdatePost>;
  updatePostForm: FormGroup;
  http: HttpClient;
  serverData!: Object | null;
  serverDataArr!: any
  message: string = "";

  constructor(dialogRef: MatDialogRef<UpdatePost>,
              fb: FormBuilder, http: HttpClient,
              @Inject(MAT_DIALOG_DATA)
              public data: PostRecord ,
              private cdr: ChangeDetectorRef ) {
    this.dialogRef = dialogRef;
    this.http = http;
    this.updatePostForm = fb.group({
      'id': [this.data.id, Validators.required],
      'mobileCode': [this.data.mobileCode],
      'dayOfWeekCode': [this.data.dayOfWeekCode],
      'seq': [this.data.seq],
      'districtEN': [this.data.districtEN],
      'nameEN': [this.data.nameEN],
      'locationEN': [this.data.locationEN],
      'addressEN': [this.data.addressEN],

      // Traditional Chinese
      'nameTC': [this.data.nameTC],
      'districtTC': [this.data.districtTC],
      'locationTC': [this.data.locationTC],
      'addressTC': [this.data.addressTC],

      // Simplified Chinese
      'nameSC': [this.data.nameSC],
      'districtSC': [this.data.districtSC],
      'locationSC': [this.data.locationSC],
      'addressSC': [this.data.addressSC],

      'openHour': [this.data.openHour],
      'closeHour': [this.data.closeHour],
      'latitude': [this.data.latitude],
      'longitude': [this.data.longitude],

    });
  }

    updateRecord(formValue: any): void {
      this.serverData = null;
      let url = '/mobilepost/' + formValue.id;

      console.log("Updating ID:...");
      console.log("URL:", url);
      // Empty field cleanup, prevent giving empty values to the db.
      Object.keys(formValue).forEach(key => {
        if (formValue[key] === '' || formValue[key] === null) {
          delete formValue[key];
        }
      });
      // field empty protection.
      if (Object.keys(formValue).length === 1) {
        this.message = "Please fill in at least one field to update.";
        return;
      }

      this.http.put(url, formValue).subscribe({
        next: (res) => {
          console.log(res);
          this.message = "Record " + formValue.id + " updated successfully!";
          //detect change
          this.cdr.detectChanges();
          // show message briefly before closing so user can read it
          setTimeout(() => this.dialogRef.close(), 2500);
        },


        error: (err) => {
          // improved error handling for test report
          if (err && err.status === 0) {
            this.message = "Cannot update. Is the server running?";
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
    this.dialogRef.close(); // cancel button — close without deleting
  }

}
