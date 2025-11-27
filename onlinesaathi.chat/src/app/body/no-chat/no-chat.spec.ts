import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoChat } from './no-chat';

describe('NoChat', () => {
  let component: NoChat;
  let fixture: ComponentFixture<NoChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoChat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
