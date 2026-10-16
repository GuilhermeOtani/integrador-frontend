import './app/core/i18n/locale';
import { NgModule, provideZoneChangeDetection } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
@NgModule({ providers: [provideZoneChangeDetection()] })
class TestModule {}
getTestBed().initTestEnvironment([BrowserTestingModule, TestModule], platformBrowserTesting(), {
  errorOnUnknownElements: true, errorOnUnknownProperties: true,
});
