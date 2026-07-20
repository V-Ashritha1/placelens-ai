import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict, field_validator

# Gmail's own account-naming rules: 6-30 chars, letters/numbers/dots/plus only,
# no leading/trailing/consecutive dots. This rejects strings that could never
# be a real Gmail username — it does NOT verify the mailbox actually exists.
GMAIL_LOCAL_PART_RE = re.compile(r"^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*(\+[a-zA-Z0-9.]+)?$")


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role_title: Optional[str] = None
    location: Optional[str] = None


class UserCreate(UserBase):
    password: str

    @field_validator("email")
    @classmethod
    def validate_gmail_email(cls, v: str) -> str:
        v = v.strip().lower()
        local_part, _, domain = v.partition("@")

        if domain != "gmail.com":
            raise ValueError("Only Gmail addresses (@gmail.com) are allowed for registration")

        local_no_plus = local_part.split("+")[0]
        if not (6 <= len(local_no_plus.replace(".", "")) <= 30):
            raise ValueError("Gmail address must be between 6 and 30 characters")

        if not GMAIL_LOCAL_PART_RE.match(local_part):
            raise ValueError("Gmail address can only contain letters, numbers, and dots")

        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role_title: Optional[str] = None
    location: Optional[str] = None


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plan: str
    is_active: bool
    created_at: datetime