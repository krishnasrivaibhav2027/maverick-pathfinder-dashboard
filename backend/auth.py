from datetime import datetime, timedelta
from jose import JWTError, jwt

SECRET_KEY = "dyxL3XGgxqzDhk7VHapcUzWgAdOpxY2Z1APQQqfTmCqfgwtSGDkSCBub5MadEeaY3_BEE07DDukPxMuSwt97lA"  # Change this to a strong, random key in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None 