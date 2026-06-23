import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PostRecord } from '../postrecord.model';

@Component({
  selector: 'app-view-post',
  imports: [CommonModule],
  templateUrl: './view-post.html',
  styleUrl: './view-post.css',
})
export class ViewPost {
  dialogRef: MatDialogRef<ViewPost>;

  constructor(dialogRef: MatDialogRef<ViewPost>, @Inject(MAT_DIALOG_DATA) public data: PostRecord) {
    this.dialogRef = dialogRef;
  }

  closeModal(): void {
    this.dialogRef.close();
  }
}

