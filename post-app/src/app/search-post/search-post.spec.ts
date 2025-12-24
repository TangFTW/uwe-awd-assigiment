import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchPost } from './search-post';

describe('SearchPost', () => {
  let component: SearchPost;
  let fixture: ComponentFixture<SearchPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchPost]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchPost);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
