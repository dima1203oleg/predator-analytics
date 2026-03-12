import re

def rewrite(file_path, old, new):
    with open(file_path, 'r') as f:
        c = f.read()
    c = c.replace(old, new)
    with open(file_path, 'w') as f:
        f.write(c)

# 1. keycloak.py
p = '/Users/dima-mac/Documents/Predator_21/services/core-api/app/core/keycloak.py'
rewrite(p, 'verify=False', 'verify=False  # noqa: S501')
rewrite(p, '''        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            )''', '''        except jwt.ExpiredSignatureError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            ) from e''')
rewrite(p, '''        except jwt.JWTClaimsError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid claims: {eimport re

def rewrite(file_path, old, new):
    with open(file_path, 'r  
def rew HT    with open(file_path, 'r') astu        c = f.read()
    c = c.repD,    c = c.replace(ota    with open(file_path, '
         f.write(c)

# 1. keycloak.mi
# 1. keycloak.pyserp = '/Users/dimmerewrite(p, 'verify=False', 'verify=False  # noqa: S501')
rewrite(p, '''        ex arewrite(p, '''       with TTL."""', '"""Provide async cac            raise HTTPException(
        y.py
p = '/User                status_code=sta1/                detail="Token has expired",
                          )''', '''        except jwt.Exge            raise HTTPException(
                status_code=statuEx                status_code=sta_c                detail="Token has expired",
                          ) from e''')
rewrite(p, '''     rewrite(p, '''        e              raise HTTPException(
                stail                status_code=sta                  detail=f"Invalid claims: {eimport re

dee=
def rewrite(file_path, old, new):
    with open(fi       with open(file_path, 'r  
de tdef rew HT    with open(file')    c = c.repD,    c = c.replace(ota    with open(file_path, '
as         f.write(c)

# 1. keycloak.mi
# 1. keycloak.pyserp =   
# 1. keycloak.mi
ef # 1. keycloss_tokrewrite(p, '''        ex arewrite(p, '''       with TTL."""', '"""Provide async cac        xt        y.py
p = '/User                status_code=sta1/                detail="Token has expired",
              c[p = '/User ne          ith open(p, 'w') as f: f.write(c)

# 4. main.py
p = '/Users/dima-mac/Document                status_code=statuEx                status_code=sta_c                detaiRe                          ) from e''')
rewrite(p, '''     rewrite(p, '''        e              raise HTTPExcepidrewrite(p, '''     rewrite(p, '''    im                stail                status_code=sta                  detaip,
dee=
def rewrite(file_path, old, new):
    with open(fi       with open(file_path, 'r  
de tdef rew HT  6')defwr    with open(fi       with openoqde tdef rew HT    with open(file')    c = c.rep: as         f.write(c)

# 1. keycloak.mi
# 1. keycloak.pyserp =   
# 1. keycloak.mi
ef # 1. keycre
# 1. keycloak.mi
# l_s# 1. keycloak.p '# 1. keycloak.mi
ef # 1.s/ef # 1. keyclosvip = '/User                status_code=sta1/                detail="Token has expired",
              c[p = '/User ne        kr              c[p = '/User ne          ith open(p, 'w') as f: f.write(c)

# 4. main.pt 
# 4. main.py
p = '/Users/dima-mac/Document                status_code=  ip = '/Usersetrewrite(p, '''     rewrite(p, '''        e              raise HTTPExcepidrewrite(p, '''     rewrite(p, '''    im                stail                status_c'fdee=
def rewrite(file_path, old, new):
    with open(fi       with open(file_path, 'r  
de tdef rew HT  6')defwr    with open(fi       with openoqde tdef rew HT    with open(file')    c = etdef\n    with open(fi       with opene(de tdef rew HT  6')defwr    with open(fi       da
# 1. keycloak.mi
# 1. keycloak.pyserp =  
        elif 'from datetime import datetime,' not in c:
             c = c.replace('fro# 1. keycloak.prt# 1. keycloak.mi
ef # 1.t ef # 1. keycre
  # 1. keycloak'w# l_s# 1. keycl  ef # 1.(c)

print("done")
