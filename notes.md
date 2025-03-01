

u_xxxxxx <- all id's will be with a letter first. 



consents
- chaned from boolean values to timestamps  
- is active should be a replace with timestamp 



All notes
i.e keep as little boolean values as possible in the db

kaylee
- confused by default


- probably put all of this stuff into its own schema in postgres
 i.e for no table naming duplication 


 - consent.io 
 - there no tenancy (no org id's) 
  - users
  - consents 
  - consent withdrawals
  - consent purposes 
  - consent records
  - audit logs
  - domains 


API'

## get consent

example; 
- user is logged in to dashboard
- docs where they are still logged in
- then request the consent 
- then hide cookie-banner 

- check that they can do something i.e analytical stuff 


getting the consent record with external user id instead of an userid. 


> for cloud version all of these will need tenant management 



## Get consent History 


## Set consent

Do you know the user id or create when you set the consent, what is the first api request. 

> check if this is linking it to a policy i.e cookie-consent policy v2
> or does it "auto" link it to the latest policy


## Overall improvements needed  
overall not sure on route names
- GET ${basePath}/get-consent -> GET ${basePath}/${version}/consent
- POST ${basePath}/set-consent -> POST ${basePath}/${version}/consent

keep as little boolean values as possible in the db

- more work around actors i.e what we was going to do in everfund. 

-> All id's are non deterministic 
 - instead of 1,2,3 
 - we have w_xxxxx for withdrawls 


-> is there any slimming that we can do? 

-> no reporting api functionality. 

-> do we need to acuate beforehand 


Consent.io 
-> are we going to have two databases by default
-> are we going to have this in the main database as well? 

-> is the orgID linked to the consent.io database? Though a Foreign Data Wrappers 
-> Postgres plugins

-> we don't want the orgID to be just a string, we want to have it cascade with a relationship 
-> more endpoints and stuff 

-> We need to think about multi-tenancy more in terms of c15t and interoping that with 
 -> or maybe add in hooks to the migration system for us to add in extra columns 

-> can the dashboard connect to a private instance of the c15t database? 
-> oh yeah connect to to our custom c15t server on 1.3 for example. 


c15t Instances
-> only use native types, (provide mysql, postgres, sql-lite wrapper)
-> Basic Endpoints

-> keeping in sync (API Versioning is a big deal )
 -> if we migrate the cloud version forward 
 -> but the user is still using a old version of c15t, how do we handle that?



Do we host every customer in there own database by default? 
-> instead of adding a orgID, you just have an the whole database be one org. 



 -> do we even provide a hosted version of c15t, or every user must bring there own db.

 -> Turso and James about cloud version / magament 

 -> Nile
 -> Neon




 We wont be able to offload problems to providers. 
 cant explain any choices away


sql-lite.


neon, 
turso
nile




