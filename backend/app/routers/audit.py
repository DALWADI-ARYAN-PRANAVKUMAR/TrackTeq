from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RoleName
from app.models.audit import AuditLog
from app.auth.deps import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("/logs")
def get_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch all audit logs and user stats. Only accessible by Admin."""
    if current_user.role != RoleName.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to view audit logs")
    
    # Compute Stats
    users = db.query(User).all()
    stats = {
        "total_users": len(users),
        "fleet_managers": sum(1 for u in users if u.role == RoleName.FLEET_MANAGER),
        "drivers": sum(1 for u in users if u.role == RoleName.DRIVER),
        "safety_officers": sum(1 for u in users if u.role == RoleName.SAFETY_OFFICER),
        "financial_analysts": sum(1 for u in users if u.role == RoleName.FINANCIAL_ANALYST),
        "admins": sum(1 for u in users if u.role == RoleName.ADMIN)
    }

    logs = db.query(AuditLog).order_by(AuditLog.login_time.desc()).all()
    
    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "user_name": user.full_name if user else "Unknown",
            "email": user.email if user else "Unknown",
            "role": user.role.value if user else "Unknown",
            "joined": user.created_at.isoformat() if user and user.created_at else None,
            "login_time": log.login_time.isoformat() if log.login_time else None,
            "logout_time": log.logout_time.isoformat() if log.logout_time else None,
            "is_active": log.is_active
        })
        
    return {"stats": stats, "logs": result}
