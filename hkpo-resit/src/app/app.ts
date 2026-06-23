import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SearchPost } from './search-post/search-post';
import { DeletePost } from './delete-post/delete-post';
import { UpdatePost } from './update-post/update-post';
import { CreatePost } from './create-post/create-post';
import { ViewPost } from './view-post/view-post';

import { PostRecord } from './postrecord.model';
import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SearchPost, DeletePost, UpdatePost, CreatePost, ViewPost] ,
  templateUrl: './app.html',
  styleUrl: './app.css',

})
export class App {
  title = 'HKPO Mobile Post Office';

  dialogConfig = new MatDialogConfig();
  createPostDialogRef: MatDialogRef<CreatePost, any> | undefined;
  deletePostDialogRef: MatDialogRef<DeletePost, any> | undefined;
  updatePostDialogRef: MatDialogRef<UpdatePost, any> | undefined;
  viewPostDialogRef: MatDialogRef<ViewPost, any> | undefined;


  constructor(private dialog: MatDialog) {
  }
  openDeleteDialog(post: PostRecord): void {
    console.log("App: deleteEvent received");
    this.dialogConfig.data = post;
    this.dialogConfig.id = "deletePost";
    this.dialogConfig.height = "500px";
    this.dialogConfig.width = "650px";
    this.deletePostDialogRef = this.dialog.open(DeletePost, this.dialogConfig);

  }
  openCreateDialog(): void {
    console.log("App: createEvent received");
    this.dialogConfig.id = "createPost";
    this.dialogConfig.height = "500px";
    this.dialogConfig.width = "650px";
    this.createPostDialogRef = this.dialog.open(CreatePost, this.dialogConfig);
  }

  openEditDialog(post: PostRecord): void {
    console.log("App: editEvent received");
    this.dialogConfig.id = "updatePost";
    this.dialogConfig.data = post;
    this.dialogConfig.height = "500px";
    this.dialogConfig.width = "650px";
    // when success, return new data and update to db.
    this.updatePostDialogRef = this.dialog.open(UpdatePost, this.dialogConfig);
  }

  openViewDialog(post: PostRecord): void {
    console.log("App: viewEvent received");
    this.dialogConfig.id = "viewPost";
    this.dialogConfig.data = post;
    this.dialogConfig.height = "600px";
    this.dialogConfig.width = "700px";
    this.viewPostDialogRef = this.dialog.open(ViewPost, this.dialogConfig);
  }
}
