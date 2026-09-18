from django.core.management.base import BaseCommand
from apps.arabic.models import ArabicLesson, ArabicPath, ArabicPracticeItem

PATHS=[("arabic-for-umrah","Arabic for Umrah","Practical Arabic vocabulary and phrases for an Umrah journey.",1),("arabic-foundations","Arabic Foundations","Common words, greetings, and simple sentence patterns.",2)]
LESSONS=[("umrah-greetings","arabic-for-umrah","Greetings and basic courtesy","Essential greetings for travel and worship.","phrase",1,20),("umrah-masjid","arabic-for-umrah","Masjid vocabulary","Common Arabic words related to the mosque.","vocabulary",2,20),("umrah-directions","arabic-for-umrah","Directions and help","Simple phrases for directions and assistance.","phrase",3,25),("arabic-words-1","arabic-foundations","Everyday Arabic words","High-frequency Arabic vocabulary.","vocabulary",1,20),("arabic-sentence-1","arabic-foundations","Simple sentence patterns","Recognize simple Arabic sentence structures.","practice",2,25)]
PRACTICE=[("umrah-greetings-q1","umrah-greetings","What does مرحباً mean?",["Hello / welcome","Thank you","Where?","Water"],0,"مرحبا is a common greeting meaning hello or welcome."),("umrah-masjid-q1","umrah-masjid","What does مسجد mean?",["Mosque","Hotel","Market","Airport"],0,"مسجد means mosque."),("umrah-directions-q1","umrah-directions","Which phrase can ask Where is ...?",["أين ...؟","شكراً","نعم","مع السلامة"],0,"أين means where."),("arabic-words-1-q1","arabic-words-1","What does ماء mean?",["Water","Food","Book","Door"],0,"ماء means water."),("arabic-sentence-1-q1","arabic-sentence-1","Which word means I?",["أنا","أنت","هو","هم"],0,"أنا means I.")]

class Command(BaseCommand):
    help="Seed demo Arabic learning content."
    def handle(self,*args,**options):
        paths={}
        for key,title,description,order in PATHS:
            paths[key]=ArabicPath.objects.update_or_create(key=key,defaults={"title":title,"description":description,"sort_order":order,"is_published":True})[0]
        lessons={}
        for key,path_key,title,description,kind,order,xp in LESSONS:
            lessons[key]=ArabicLesson.objects.update_or_create(key=key,defaults={"path":paths[path_key],"title":title,"description":description,"kind":kind,"sort_order":order,"xp_reward":xp,"is_published":True})[0]
        for key,lesson_key,prompt,options,correct,explanation in PRACTICE:
            ArabicPracticeItem.objects.update_or_create(key=key,defaults={"lesson":lessons[lesson_key],"prompt":prompt,"options":options,"correct_option_index":correct,"explanation":explanation})
        self.stdout.write(self.style.SUCCESS("Seeded Arabic learning demo content."))
