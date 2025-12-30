import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-post',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-post.html',
  styleUrl: './view-post.css',
})
export class ViewPost {
  // Input: the record to display
  record = input.required<any>();
  
  // Output events
  closeModal = output();
  editRecord = output<any>();
  deleteRecord = output<any>();
  
  close() {
    this.closeModal.emit();
  }
  
  onEdit() {
    this.editRecord.emit(this.record());
  }
  
  onDelete() {
    this.deleteRecord.emit(this.record());
  }
  
  // Helper to get day name
  getDayName(dayCode: number): string {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayCode] || 'Unknown';
  }

  // Open Google Maps with location
  openGoogleMaps() {
    const rec = this.record();
    const lat = rec.latitude;
    const lng = rec.longitude;
    
    if (!lat || !lng) {
      alert('No GPS coordinates available for this location');
      return;
    }
    
    // Create location label
    const label = rec.locationEN || rec.nameEN || 'Mobile Post Office';
    
    // Open Google Maps in new tab
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(label)}`;
    window.open(url, '_blank');
  }
}
