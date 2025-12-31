import { Routes } from '@angular/router';
import { CreatePost } from './create-post/create-post';
import { SearchPost } from './search-post/search-post';
import { UpdatePost } from './update-post/update-post';
import { DeletePost } from './delete-post/delete-post';

export const routes: Routes = [
  { path: '', redirectTo: 'search-post', pathMatch: 'full' },
  { path: 'search-post', component: SearchPost },
  { path: 'create-post', component: CreatePost },
  { path: 'update-post', component: UpdatePost },
  { path: 'delete-post', component: DeletePost }
];
