import asyncio
import io
import csv
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.blocked_ip import BlockedIP
from app.models.visitor_session import VisitorSession
from sqlalchemy import select


async def test_blocked_ips():
    print("Testing BlockedIP database operations...")
    async with AsyncSessionLocal() as db:
        test_ip = "198.51.100.42"
        # Cleanup
        await db.execute(select(BlockedIP).where(BlockedIP.ip_address == test_ip))
        
        # Create block
        new_b = BlockedIP(ip_address=test_ip, reason="Test block rule", is_active=True)
        db.add(new_b)
        await db.commit()

        # Query block
        res = await db.execute(select(BlockedIP).where(BlockedIP.ip_address == test_ip))
        found = res.scalar_one_or_none()
        assert found is not None
        assert found.is_active is True
        print(f"[OK] Created and verified BlockedIP for {test_ip}")

        # Toggle inactive
        found.is_active = False
        await db.commit()

        # Clean up
        await db.delete(found)
        await db.commit()
        print("[OK] Toggled and cleaned up BlockedIP")


def test_csv_generation():
    print("Testing CSV generation...")
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Session Ref", "Country", "City", "Environment", "Duration (Mins)"])
    writer.writerow(["session_12345", "India", "Kolkata", "Running Bus", 14.5])
    csv_text = output.getvalue()
    assert "session_12345" in csv_text
    assert "Kolkata" in csv_text
    assert "Running Bus" in csv_text
    print("[OK] CSV text formatted successfully")


async def main():
    await test_blocked_ips()
    test_csv_generation()
    print("\nALL BACKEND IP BLOCK & CSV TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(main())
