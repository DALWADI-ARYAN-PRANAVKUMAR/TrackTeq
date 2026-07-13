from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, Token, LoginRequest
from app.auth.security import hash_password, verify_password, create_access_token
from app.auth.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


from datetime import datetime
from app.models.audit import AuditLog

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Standard OAuth2 password flow (form-encoded username/password) so the
    Swagger UI 'Authorize' button and most frontend HTTP clients work out
    of the box. `username` field = email.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive.")

    # Create Audit Log
    audit = AuditLog(user_id=user.id, login_time=datetime.utcnow(), is_active=True)
    db.add(audit)
    db.commit()

    access_token = create_access_token(data={"sub": user.id, "role": user.role.value})
    return Token(access_token=access_token, user=user)


@router.post("/login-json", response_model=Token)
def login_json(payload: LoginRequest, db: Session = Depends(get_db)):
    """Convenience JSON login for frontends that don't want form-encoding."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive.")

    # Create Audit Log
    audit = AuditLog(user_id=user.id, login_time=datetime.utcnow(), is_active=True)
    db.add(audit)
    db.commit()

    access_token = create_access_token(data={"sub": user.id, "role": user.role.value})
    return Token(access_token=access_token, user=user)


@router.post("/logout")
def logout(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Logout endpoint to mark the user's active session as inactive and set logout_time."""
    # Find the most recent active session
    audit = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id,
        AuditLog.is_active == True
    ).order_by(AuditLog.login_time.desc()).first()
    
    if audit:
        audit.is_active = False
        audit.logout_time = datetime.utcnow()
        db.commit()
    
    return {"status": "ok", "message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
