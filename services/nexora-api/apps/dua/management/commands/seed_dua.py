from django.core.management.base import BaseCommand
from apps.dua.models import DuaEntry
DATA=[("before-sleep","Before Sleep","daily","بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا","In Your name, O Allah, I die and I live.","Sahih al-Bukhari"),("leaving-home","Leaving Home","daily","بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ","In the name of Allah, I place my trust in Allah; there is no power and no strength except through Allah.","Abu Dawud, al-Tirmidhi"),("entering-masjid","Entering the Masjid","masjid","اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ","O Allah, open for me the doors of Your mercy.","Sahih Muslim")]
class Command(BaseCommand):
 def handle(self,*args,**kwargs):
  for key,title,category,arabic,translation,reference in DATA: DuaEntry.objects.update_or_create(key=key,defaults={"title":title,"category":category,"arabic":arabic,"translation":translation,"reference":reference,"is_published":True})
  self.stdout.write(self.style.SUCCESS("Seeded dua catalog."))
