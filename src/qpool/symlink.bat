@echo off
mklink /j domain "../hayo/domain"
mklink /j infrastructure "../hayo/infrastructure"
mklink /j public "../hayo/public"
mklink /h index.ts "../hayo/index.ts"
