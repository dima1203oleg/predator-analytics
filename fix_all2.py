import re

def write_file(path, content):
    with open(path, 'w') as f:
        f.write(content)

def read_file(path):
    with open(path, 'r') as f:
        return f.read()

# 1. config.py
p = '/Users/dima-mac/Documents/Predator_21/services/core-api/app/config.py'
c = read_file(p)
c = c.replace('SECRET_KEY: str = "REQUIRED_IN_PRODUCTION"\n', 'SECRET_KEY: str = "REQUIRED_IN_PRODUCTION"  # noqa: S105\n')
write_file(p, c)

# 2. keycloak.py
p = '/Users/dima-mac/Documents/Predator_21/services/core-api/app/core/keycloak.py'
c = read_file(p)
c = re.sub(r'except jwt\.ExpiredSignatureError:\n\s+raise HTTPException\(\n\s+status_code=status\.HTTP_401_UNAUTHORIZED,\n\s+detail="Token has expired",\n\s+\)', 'except jwt.ExpiredSignatureError as e:\n            raise HTTPException(\n                status_code=status.HTTP_401_UNAUTHORIZED,\n                detail="Token has expired",\n            ) from e', c)
c = re.sub(r'except jwt\.JWTClaimsError as e:\n\s+raise HTTPException\(\n\s+status_codeimport re

def write_fileRI
def wri+de    with open(path, 'w') as f,\        f.write(content)

defsE
def read_file(path):
  ra    with open(path,n         return f.read()

# 1.at
# 1. config.py
p = '/ED,p = '/Users/d  c = read_file(p)
c = c.replace('SECRET_KEY: str = "REQUIRED_IN_PRODUCTION" cc = c.replace('y.write_file(p, c)

# 2. keycloak.py
p = '/Users/dima-mac/Documents/Predator_21/services/core-api/app/core/keycloak.py'
c = y'
# 2. keycloak.p)
p = '/Usub(r'excec = read_file(p)
c = re.sub(r'except jwt\.ExpiredSignatureError:\n\s+raise HTTPExrac = re.sub(r'exonc = re.sub(r'except jwt\.JWTClaimsError as e:\n\s+raise HTTPException\(\n\s+status_codeimport re

def write_fileRI
def wri+de    with open(path, 'w') as f,\        f.write(content)

defsE
def read_file(path):
  ra    with open(path,n         return f.read()

# 1.at
# 1. config.py
p = '/ED,p = '/Users/d  c = read_file(p)
c = c.replace('SECRET_KEY: str = "REQUIRED_es
def write_fileRI
def wri+de    with open(path, 'w') as f,\        f.write(content)

defsE
def  crdef wri+de    wen
defsE
def read_file(path):
  ra    with open(path,n         ret Trdef     ra    with open(p.s
# 1.at
# 1. config.py
p = '/ED,p = '/Users/d  cre# 1. ccp = '/ED,p = 
 c = c.replace('SECRET_KEY: str  not skip:
# 2. keycloak.py
p = '/Users/dima-mac/Documents/Predator_21/services/core-api/app/core/keywarp = '/Us/Users/dic = y'
# 2. keycloak.p)
p = '/Usub(r'excec = read_file(p)
c = re.sub(r'except jwtfr# 2. p.p = '/Usub(r'ext c = re.sub(r'except jwt\.Expired  
def write_fileRI
def wri+de    with open(path, 'w') as f,\        f.write(content)

defsE
def read_file(path):
  ra    with open(path,n         return f.read()

# 1.at
# 1. conffildef wri+de    wut
defsE
def read_file(path):
  ra    with open(path,n         retervdef /c  ra    with open(p/a
# 1.at
# 1. config.py
p = '/ED,p = '/Users/d  e="# 1. r"p = '/ED,p = toc = c.replace('SECRET_KEY: str = "REQUIn'def write_fileRI
def wri+de    with open(pat idef wri+de    w [
defsE
def  crdef wri+de    wen
defsE
def read_file(path):
  ra p/sdef cedefsE
def read_file(pat'/def s/  ra    with open(pPr# 1.at
# 1. config.py
p = '/ED,p = '/Users/d  cre# 1. ccp = '/ED,  # 1. erp = '/ED,p = cu c = c.replace('SECRET_KEY: str  not skip:
# 2es# 2. ine_registries.py'
]:
    c = read_filp = '/Users/dimom# 2. keycloak.p)
p = '/Usub(r'excec = read_file(p)
c = re.sub(r'except jwtfr# 2. p.p = '/Usub(r'extep = '/Usub(r'exetc = re.sub(r'except jwtfr# 2. petidef wimezone')
    write_file(p, c)

print("done")
