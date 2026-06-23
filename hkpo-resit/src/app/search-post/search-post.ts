import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PostRecord } from '../postrecord.model';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
// Dom Santizer: to allow google map use in the app(since Angular blocks exernal web connection)
import { DomSanitizer , SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-search-post',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-post.html',
  styleUrl: './search-post.css',
})


//
export class SearchPost implements OnInit {
  // propteries
  @Output() deletePostEvent = new EventEmitter<PostRecord>();
  @Output() editPostEvent: EventEmitter<PostRecord> = new EventEmitter<PostRecord>();
  //adds view
  @Output() viewPostEvent: EventEmitter<PostRecord> = new EventEmitter<PostRecord>();
  searchPostForm: FormGroup;
  http: HttpClient;
  serverDataArr: any[] = [];
  message: string = 'Search record here.'
  mapAddress: string = ""; // address to show in Google Maps iframe
  mapUrl: SafeResourceUrl = "";


  constructor(fb: FormBuilder, http: HttpClient, private sanitizer: DomSanitizer) {
    this.http = http;
    // Form Bulider
    this.searchPostForm = fb.group({
      'id': ['', [Validators.pattern(/^\d*$/)]],
      'districtEN': [''],
      'addressEN' : [''],
      'nameEN': [''],
      'dayOfWeekCode': ['', [Validators.pattern(/^\d*$/)]],
      'mobileCode': ['', [Validators.pattern(/^\d*$/)]],
      'seq' : ['', [Validators.pattern(/^\d*$/)]],
      'openHour': ['', [Validators.pattern(/^$|^([01]\d|2[0-3]):[0-5]\d$/)]],
      'closeHour': ['', [Validators.pattern(/^$|^([01]\d|2[0-3]):[0-5]\d$/)]]
    });
  }
//methods
  deleteButtonHandler(post: PostRecord): void {
    console.log("Delete clicked for post ID:", post.id);
    this.deletePostEvent.emit(post);
    // Connect it when you making delete-post.
  }

  editButtonHandler(post: PostRecord): void {
    console.log("Edited record for post ID:", post.id);
    // when update, tell me.
    this.editPostEvent.emit(post);
  }

  viewButtonHandler(post: PostRecord): void {
    console.log("View clicked for post ID:", post.id);
    this.viewPostEvent.emit(post);
  }
// gooogle map - uses latitude and longitude for accurate location
    showMap(latitude: number, longitude: number, addressEN: string): void {
      this.mapAddress = addressEN;
      const url = "https://maps.google.com/maps?q=" + latitude + "," + longitude + "&output=embed";
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

  }

  getAllPosts(): void {
    let url = '/mobilepost';
    console.log(url);
    this.http.get(url).subscribe({
      next: (res) => {
        console.log("Data received:", res);
        this.serverDataArr = (res as any).data;
        if (!this.serverDataArr || this.serverDataArr.length === 0) {
          this.message = "Record not found.";
        } else {
          this.message = "";
        }
      },
      error: (err) => {
        // improved error handling for test report
        if (err && err.status === 0) {
          this.message = "Cannot search. Is the server running?";
        } else if (err && err.status === 404) {
          this.message = "Record not found.";
        } else if (err && (
          (err.message && err.message.toLowerCase().includes('invalid parameter')) ||
          (err.error && typeof err.error === 'string' && err.error.toLowerCase().includes('invalid parameter')) ||
          (err.error && err.error.message && err.error.message.toLowerCase().includes('invalid parameter'))
        )) {
          this.message = "Invalid parameter.";
        } else {
          this.message = "Error: " + (err?.message || err?.statusText || 'Unknown error');
        }
        console.log(err);
      }
    });
  }

  onSubmit(formValue: any): void {
    if (this.searchPostForm.invalid) {
      this.message = 'Invalid parameter.';
      return;
    }

    const hasAnyValue = Object.values(formValue).some(v => String(v ?? '').trim() !== '');
    if (!hasAnyValue) {
      this.message = 'Please enter at least one search value.';
      return;
    }

    const { id, districtEN, dayOfWeekCode, mobileCode, nameEN, addressEN, openHour, closeHour, seq } = formValue;
    let url = '/mobilepost?';
    const params: string[] = [];
    const idValue = String(id ?? '').trim();
    const mobileCodeValue = String(mobileCode ?? '').trim();
    const dayOfWeekCodeValue = String(dayOfWeekCode ?? '').trim();
    const districtENValue = String(districtEN ?? '').trim();
    const nameENValue = String(nameEN ?? '').trim();
    const addressENValue = String(addressEN ?? '').trim();
    const seqValue = String(seq ?? '').trim();
    const openHourValue = String(openHour ?? '').trim();
    const closeHourValue = String(closeHour ?? '').trim();

    if (idValue) params.push(`id=${encodeURIComponent(idValue)}`);
    if (mobileCodeValue) params.push(`mobileCode=${encodeURIComponent(mobileCodeValue)}`);
    if (dayOfWeekCodeValue) params.push(`dayOfWeekCode=${encodeURIComponent(dayOfWeekCodeValue)}`);
    if (districtENValue) params.push(`districtEN=${encodeURIComponent(districtENValue)}`);
    if (nameENValue) params.push(`nameEN=${encodeURIComponent(nameENValue)}`);
    if (addressENValue) params.push(`addressEN=${encodeURIComponent(addressENValue)}`);
    if (seqValue) params.push(`seq=${encodeURIComponent(seqValue)}`);
    if (openHourValue) params.push(`openHour=${encodeURIComponent(openHourValue)}`);
    if (closeHourValue) params.push(`closeHour=${encodeURIComponent(closeHourValue)}`);

    if (params.length) url += params.join('&');

    console.log(url);
    this.http.get(url).subscribe({
      next: (res) => {
        console.log("Search results:", res);
        this.serverDataArr = (res as any).data;
        if (!this.serverDataArr || this.serverDataArr.length === 0) {
          this.message = "Record not found.";
        } else {
          this.message = "";
        }
      },
      error: (err) => {
        // improved error handling for test report
        if (err && err.status === 0) {
          this.message = "Cannot search. Is the server running?";
        } else if (err && err.status === 404) {
          this.message = "Record not found.";
        } else if (err && (
          (err.message && err.message.toLowerCase().includes('invalid parameter')) ||
          (err.error && typeof err.error === 'string' && err.error.toLowerCase().includes('invalid parameter')) ||
          (err.error && err.error.message && err.error.message.toLowerCase().includes('invalid parameter'))
        )) {
          this.message = "Invalid parameter.";
        } else {
          this.message = "Error: " + (err?.message || err?.statusText || 'Unknown error');
        }
        console.log(err);
      }
    });
  }

  // void aka do something, but return nothing
  ngOnInit(): void {
    // do not auto-load; results show only after Search or Show All Records
  }

}
