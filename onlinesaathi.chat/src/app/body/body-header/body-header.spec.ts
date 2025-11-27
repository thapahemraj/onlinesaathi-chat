import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BodyHeader } from './body-header';

describe('BodyHeader', () => {
  let component: BodyHeader;
  let fixture: ComponentFixture<BodyHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BodyHeader]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BodyHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
