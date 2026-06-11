import asyncio
from adv_dvs.validators.level1_infra import Level1InfraValidator

async def main():
    validator = Level1InfraValidator()
    result = await validator.validate()
    print(result)

if __name__ == "__main__":
    asyncio.run(main())
