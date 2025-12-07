import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ua-sources")))

from app.services.shadow_service import shadow_service

async def main():
    print("🔒 Predator Shadow Protocol Verification 🔒")
    
    # 1. List
    print("\n1. Accessing Shadow Layer...")
    docs = shadow_service.list_classified_docs()
    print(f"   Found {len(docs)} sealed documents: {docs}")
    
    # 2. Decrypt
    target = "omega_directive"
    if target in docs:
        print(f"\n2. Decrypting '{target}'...")
        doc = shadow_service.reveal_document(target)
        if doc:
            print(f"   ✅ Decryption Success!")
            print(f"   Title: {doc.get('title')}")
            print(f"   Content: {doc.get('content')[:50]}...")
        else:
            print("   ❌ Decryption Failed")
    
    # 3. Encrypt New
    print("\n3. Sealing new intelligence...")
    success = shadow_service.seal_document("verify_test", {
        "title": "Verification Run",
        "content": "Shadow logic is operational.",
        "clearance": "LOW"
    })
    print(f"   Sealing status: {'✅' if success else '❌'}")

if __name__ == "__main__":
    asyncio.run(main())
