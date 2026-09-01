from fastapi import HTTPException, status


def require_authenticated_user() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Authentication will be implemented in step 4.",
    )

