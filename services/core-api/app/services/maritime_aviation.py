"""Maritime & Aviation Service — Інтеграція з AIS/ADS-B.

Джерела:
- MarineTraffic — відстеження суден (AIS)
- FlightRadar24 — відстеження літаків (ADS-B)
- VesselFinder — альтернативне джерело AIS
- FlightAware — альтернативне джерело ADS-B
"""
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
import logging
import os
from typing import Any, Dict # Додано Dict для більш точної типізації

import httpx

logger = logging.getLogger(__name__)


class VesselType(StrEnum):
    """Типи суден."""

    CARGO = "cargo"
    TANKER = "tanker"
    CONTAINER = "container"
    BULK_CARRIER = "bulk_carrier"
    PASSENGER = "passenger"
    FISHING = "fishing"
    TUG = "tug"
    YACHT = "yacht"
    MILITARY = "military"
    OTHER = "other"


class AircraftType(StrEnum):
    """Типи повітряних суден."""

    COMMERCIAL = "commercial"
    CARGO = "cargo"
    PRIVATE = "private"
    MILITARY = "military"
    HELICOPTER = "helicopter"
    OTHER = "other"


@dataclass
class VesselPosition:
    """Позиція судна."""

    mmsi: str
    imo: str | None
    name: str
    callsign: str | None
    vessel_type: VesselType
    flag: str | None
    latitude: float
    longitude: float
    speed: float  # knots
    course: float  # degrees
    heading: float | None
    destination: str | None
    eta: datetime | None
    draught: float | None
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class AircraftPosition:
    """Позиція літака."""

    icao24: str
    callsign: str | None
    registration: str | None
    aircraft_type: str | None
    origin: str | None
    destination: str | None
    latitude: float
    longitude: float
    altitude: float  # feet
    speed: float  # knots
    heading: float
    vertical_rate: float | None  # feet/min
    on_ground: bool
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class VesselInfo:
    """Детальна інформація про судно."""

    mmsi: str
    imo: str | None
    name: str
    callsign: str | None
    vessel_type: VesselType
    flag: str | None
    gross_tonnage: int | None
    deadweight: int | None
    length: float | None
    beam: float | None
    year_built: int | None
    owner: str | None
    manager: str | None
    insurer: str | None


@dataclass
class PortCall:
    """Заход у порт."""

    port_name: str
    port_code: str | None
    country: str
    arrival: datetime | None
    departure: datetime | None
    duration_hours: float | None


@dataclass
class VesselHistory:
    """Історія руху судна."""

    mmsi: str
    name: str
    port_calls: list[PortCall] = field(default_factory=list)
    track: list[dict] = field(default_factory=list)


class MarineTrafficClient:
    """Клієнт MarineTraffic API."""

    BASE_URL = "https://services.marinetraffic.com/api"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("MARINETRAFFIC_API_KEY", "")
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_vessel_position(self, mmsi: str) -> VesselPosition | None:
        """Отримати поточну позицію судна за MMSI."""
        if not self.api_key:
            logger.warning("MarineTraffic API key не налаштовано")
            return self._mock_vessel_position(mmsi)

        try:
            url = f"{self.BASE_URL}/exportvessel/v:5/{self.api_key}"
            params = {"mmsi": mmsi, "protocol": "jsono"}

            response = await self.client.get(url, params=params)
            response.raise_for_status()

            data = response.json()
            if not data:
                return None

            vessel = data[0] if isinstance(data, list) else data

            return VesselPosition(
                mmsi=vessel.get("MMSI", mmsi),
                imo=vessel.get("IMO"),
                name=vessel.get("SHIPNAME", "Unknown"),
                callsign=vessel.get("CALLSIGN"),
                vessel_type=self._parse_vessel_type(vessel.get("SHIPTYPE")),
                flag=vessel.get("FLAG"),
                latitude=float(vessel.get("LAT", 0)),
                longitude=float(vessel.get("LON", 0)),
                speed=float(vessel.get("SPEED", 0)) / 10,  # MarineTraffic повертає speed * 10
                course=float(vessel.get("COURSE", 0)) / 10,
                heading=float(vessel.get("HEADING")) if vessel.get("HEADING") else None,
                destination=vessel.get("DESTINATION"),
                eta=self._parse_eta(vessel.get("ETA")),
                draught=float(vessel.get("DRAUGHT", 0)) / 10 if vessel.get("DRAUGHT") else None,
            )
        except Exception as e:
            logger.error(f"Помилка MarineTraffic API: {e}")
            return self._mock_vessel_position(mmsi)

    async def search_vessels_in_area(
        self,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
    ) -> list[VesselPosition]:
        """Пошук суден у заданому районі."""
        if not self.api_key:
            return self._mock_vessels_in_area()

        try:
            url = f"{self.BASE_URL}/exportvessels/v:8/{self.api_key}"
            params = {
                "MINLAT": lat_min,
                "MAXLAT": lat_max,
                "MINLON": lon_min,
                "MAXLON": lon_max,
                "protocol": "jsono",
            }

            response = await self.client.get(url, params=params)
            response.raise_for_status()

            data = response.json()
            vessels = []

            for vessel in data:
                vessels.append(VesselPosition(
                    mmsi=vessel.get("MMSI", ""),
                    imo=vessel.get("IMO"),
                    name=vessel.get("SHIPNAME", "Unknown"),
                    callsign=vessel.get("CALLSIGN"),
                    vessel_type=self._parse_vessel_type(vessel.get("SHIPTYPE")),
                    flag=vessel.get("FLAG"),
                    latitude=float(vessel.get("LAT", 0)),
                    longitude=float(vessel.get("LON", 0)),
                    speed=float(vessel.get("SPEED", 0)) / 10,
                    course=float(vessel.get("COURSE", 0)) / 10,
                    heading=None,
                    destination=vessel.get("DESTINATION"),
                    eta=None,
                    draught=None,
                ))

            return vessels
        except Exception as e:
            logger.error(f"Помилка MarineTraffic API: {e}")
            return self._mock_vessels_in_area()

    async def get_vessel_info(self, mmsi: str) -> VesselInfo | None:
        """Отримати детальну інформацію про судно."""
        if not self.api_key:
            return self._mock_vessel_info(mmsi)

        try:
            url = f"{self.BASE_URL}/vesselmaster/v:3/{self.api_key}"
            params = {"mmsi": mmsi, "protocol": "jsono"}

            response = await self.client.get(url, params=params)
            response.raise_for_status()

            data = response.json()
            if not data:
                return None

            vessel = data[0] if isinstance(data, list) else data

            return VesselInfo(
                mmsi=vessel.get("MMSI", mmsi),
                imo=vessel.get("IMO"),
                name=vessel.get("SHIPNAME", "Unknown"),
                callsign=vessel.get("CALLSIGN"),
                vessel_type=self._parse_vessel_type(vessel.get("SHIPTYPE")),
                flag=vessel.get("FLAG"),
                gross_tonnage=vessel.get("GT"),
                deadweight=vessel.get("DWT"),
                length=vessel.get("LENGTH"),
                beam=vessel.get("WIDTH"),
                year_built=vessel.get("YEAR_BUILT"),
                owner=vessel.get("OWNER"),
                manager=vessel.get("MANAGER"),
                insurer=vessel.get("INSURER"),
            )
        except Exception as e:
            logger.error(f"Помилка MarineTraffic API: {e}")
            return self._mock_vessel_info(mmsi)

    async def get_port_calls(self, mmsi: str, days: int = 90) -> list[PortCall]:
        """Отримати історію заходів у порти."""
        if not self.api_key:
            return self._mock_port_calls()

        try:
            url = f"{self.BASE_URL}/portcalls/v:4/{self.api_key}"
            params = {"mmsi": mmsi, "days": days, "protocol": "jsono"}

            response = await self.client.get(url, params=params)
            response.raise_for_status()

            data = response.json()
            port_calls = []

            for call in data:
                port_calls.append(PortCall(
                    port_name=call.get("PORT_NAME", "Unknown"),
                    port_code=call.get("UNLOCODE"),
                    country=call.get("COUNTRY", ""),
                    arrival=self._parse_datetime(call.get("TIMESTAMP_ATA")),
                    departure=self._parse_datetime(call.get("TIMESTAMP_ATD")),
                    duration_hours=call.get("DURATION"),
                ))

            return port_calls
        except Exception as e:
            logger.error(f"Помилка MarineTraffic API: {e}")
            return self._mock_port_calls()

    def _parse_vessel_type(self, type_code: int | str | None) -> VesselType:
        """Парсинг типу судна."""
        if not type_code:
            return VesselType.OTHER

        type_code = int(type_code) if isinstance(type_code, str) else type_code

        # AIS vessel type codes
        if 70 <= type_code <= 79:
            return VesselType.CARGO
        elif 80 <= type_code <= 89:
            return VesselType.TANKER
        elif 60 <= type_code <= 69:
            return VesselType.PASSENGER
        elif 30 <= type_code <= 39:
            return VesselType.FISHING
        elif type_code in [31, 32, 52]:
            return VesselType.TUG
        elif type_code == 36:
            return VesselType.YACHT
        elif type_code == 35:
            return VesselType.MILITARY
        else:
            return VesselType.OTHER

    def _parse_eta(self, eta_str: str | None) -> datetime | None:
        """Парсинг ETA."""
        if not eta_str:
            return None
        try:
            return datetime.strptime(eta_str, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=UTC)
        except ValueError:
            return None

    def _parse_datetime(self, dt_str: str | None) -> datetime | None:
        """Парсинг datetime."""
        if not dt_str:
            return None
        try:
            return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        except ValueError:
            return None

    def _mock_vessel_position(self, mmsi: str) -> VesselPosition:
        """Mock дані для тестування."""
        return VesselPosition(
            mmsi=mmsi,
            imo="9876543",
            name="MOCK VESSEL",
            callsign="MOCK1",
            vessel_type=VesselType.CARGO,
            flag="UA",
            latitude=46.4825,
            longitude=30.7233,
            speed=12.5,
            course=180.0,
            heading=182.0,
            destination="ODESA",
            eta=datetime.now(UTC),
            draught=8.5,
        )

    def _mock_vessels_in_area(self) -> list[VesselPosition]:
        """Mock список суден."""
        return [
            self._mock_vessel_position("123456789"),
            VesselPosition(
                mmsi="987654321",
                imo="1234567",
                name="MOCK TANKER",
                callsign="MOCK2",
                vessel_type=VesselType.TANKER,
                flag="PA",
                latitude=46.5,
                longitude=30.8,
                speed=8.0,
                course=90.0,
                heading=92.0,
                destination="ISTANBUL",
                eta=None,
                draught=10.2,
            ),
        ]

    def _mock_vessel_info(self, mmsi: str) -> VesselInfo:
        """Mock інформація про судно."""
        return VesselInfo(
            mmsi=mmsi,
            imo="9876543",
            name="MOCK VESSEL",
            callsign="MOCK1",
            vessel_type=VesselType.CARGO,
            flag="UA",
            gross_tonnage=25000,
            deadweight=35000,
            length=180.0,
            beam=28.0,
            year_built=2015,
            owner="Mock Shipping Ltd",
            manager="Mock Management",
            insurer="Mock Insurance",
        )

    def _mock_port_calls(self) -> list[PortCall]:
        """Mock історія портів."""
        return [
            PortCall(
                port_name="Odesa",
                port_code="UAODS",
                country="Ukraine",
                arrival=datetime(2026, 3, 1, 10, 0, tzinfo=UTC),
                departure=datetime(2026, 3, 3, 14, 0, tzinfo=UTC),
                duration_hours=52.0,
            ),
            PortCall(
                port_name="Istanbul",
                port_code="TRIST",
                country="Turkey",
                arrival=datetime(2026, 2, 25, 8, 0, tzinfo=UTC),
                departure=datetime(2026, 2, 27, 16, 0, tzinfo=UTC),
                duration_hours=56.0,
            ),
        ]

    async def close(self):
        """Закриття клієнта."""
        await self.client.aclose()


class FlightRadarClient:
    """Клієнт FlightRadar24 API."""

    BASE_URL = "https://api.flightradar24.com"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("FLIGHTRADAR24_API_KEY", "")
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_aircraft_position(self, registration: str) -> AircraftPosition | None:
        """Отримати поточну позицію літака за реєстрацією."""
        if not self.api_key:
            logger.warning("FlightRadar24 API key не налаштовано")
            return self._mock_aircraft_position(registration)

        try:
            url = f"{self.BASE_URL}/common/v1/flight/list.json"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            params = {"query": registration}

            response = await self.client.get(url, headers=headers, params=params)
            response.raise_for_status()

            data = response.json()
            flights = data.get("result", {}).get("response", {}).get("data", [])

            if not flights:
                return None

            flight = flights[0]

            return AircraftPosition(
                icao24=flight.get("aircraft", {}).get("hex", ""),
                callsign=flight.get("identification", {}).get("callsign"),
                registration=flight.get("aircraft", {}).get("registration"),
                aircraft_type=flight.get("aircraft", {}).get("model", {}).get("code"),
                origin=flight.get("airport", {}).get("origin", {}).get("code", {}).get("iata"),
                destination=flight.get("airport", {}).get("destination", {}).get("code", {}).get("iata"),
                latitude=float(flight.get("trail", [{}])[0].get("lat", 0)),
                longitude=float(flight.get("trail", [{}])[0].get("lng", 0)),
                altitude=float(flight.get("trail", [{}])[0].get("alt", 0)),
                speed=float(flight.get("trail", [{}])[0].get("spd", 0)),
                heading=float(flight.get("trail", [{}])[0].get("hd", 0)),
                vertical_rate=None,
                on_ground=flight.get("status", {}).get("live", False) is False,
            )
        except Exception as e:
            logger.error(f"Помилка FlightRadar24 API: {e}")
            return self._mock_aircraft_position(registration)

    async def search_flights_in_area(
        self,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
    ) -> list[AircraftPosition]:
        """Пошук літаків у заданому районі."""
        if not self.api_key:
            return self._mock_flights_in_area()

        try:
            url = f"{self.BASE_URL}/common/v1/flight/list.json"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            params = {
                "bounds": f"{lat_max},{lat_min},{lon_min},{lon_max}",
            }

            response = await self.client.get(url, headers=headers, params=params)
            response.raise_for_status()

            data = response.json()
            flights = data.get("result", {}).get("response", {}).get("data", [])

            aircraft_list = []
            for flight in flights:
                trail = flight.get("trail", [{}])
                if not trail:
                    continue

                latest = trail[0]
                aircraft_list.append(AircraftPosition(
                    icao24=flight.get("aircraft", {}).get("hex", ""),
                    callsign=flight.get("identification", {}).get("callsign"),
                    registration=flight.get("aircraft", {}).get("registration"),
                    aircraft_type=flight.get("aircraft", {}).get("model", {}).get("code"),
                    origin=flight.get("airport", {}).get("origin", {}).get("code", {}).get("iata"),
                    destination=flight.get("airport", {}).get("destination", {}).get("code", {}).get("iata"),
                    latitude=float(latest.get("lat", 0)),
                    longitude=float(latest.get("lng", 0)),
                    altitude=float(latest.get("alt", 0)),
                    speed=float(latest.get("spd", 0)),
                    heading=float(latest.get("hd", 0)),
                    vertical_rate=None,
                    on_ground=False,
                ))

            return aircraft_list
        except Exception as e:
            logger.error(f"Помилка FlightRadar24 API: {e}")
            return self._mock_flights_in_area()

    async def get_flight_history(
        self,
        registration: str,
        days: int = 30,
    ) -> list[dict]:
        """Отримати історію польотів."""
        if not self.api_key:
            return self._mock_flight_history()

        try:
            url = f"{self.BASE_URL}/common/v1/flight/list.json"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            params = {
                "query": registration,
                "fetchBy": "reg",
                "limit": 100,
            }

            response = await self.client.get(url, headers=headers, params=params)
            response.raise_for_status()

            data = response.json()
            flights = data.get("result", {}).get("response", {}).get("data", [])

            history = []
            for flight in flights:
                history.append({
                    "flight_number": flight.get("identification", {}).get("number", {}).get("default"),
                    "callsign": flight.get("identification", {}).get("callsign"),
                    "origin": flight.get("airport", {}).get("origin", {}).get("code", {}).get("iata"),
                    "destination": flight.get("airport", {}).get("destination", {}).get("code", {}).get("iata"),
                    "departure_time": flight.get("time", {}).get("real", {}).get("departure"),
                    "arrival_time": flight.get("time", {}).get("real", {}).get("arrival"),
                    "status": flight.get("status", {}).get("text"),
                })

            return history
        except Exception as e:
            logger.error(f"Помилка FlightRadar24 API: {e}")
            return self._mock_flight_history()

    def _mock_aircraft_position(self, registration: str) -> AircraftPosition:
        """Mock дані для тестування."""
        return AircraftPosition(
            icao24="508035",
            callsign="PS101",
            registration=registration,
            aircraft_type="B738",
            origin="KBP",
            destination="IST",
            latitude=41.2,
            longitude=29.0,
            altitude=35000,
            speed=450,
            heading=180,
            vertical_rate=0,
            on_ground=False,
        )

    def _mock_flights_in_area(self) -> list[AircraftPosition]:
        """Mock список літаків."""
        return [
            self._mock_aircraft_position("UR-PSA"),
            AircraftPosition(
                icao24="508036",
                callsign="PS102",
                registration="UR-PSB",
                aircraft_type="E190",
                origin="ODS",
                destination="WAW",
                latitude=50.1,
                longitude=24.5,
                altitude=32000,
                speed=420,
                heading=315,
                vertical_rate=500,
                on_ground=False,
            ),
        ]

    def _mock_flight_history(self) -> list[dict]:
        """Mock історія польотів."""
        return [
            {
                "flight_number": "PS101",
                "callsign": "AUI101",
                "origin": "KBP",
                "destination": "IST",
                "departure_time": "2026-03-10T08:00:00Z",
                "arrival_time": "2026-03-10T10:30:00Z",
                "status": "Landed",
            },
            {
                "flight_number": "PS102",
                "callsign": "AUI102",
                "origin": "IST",
                "destination": "KBP",
                "departure_time": "2026-03-10T12:00:00Z",
                "arrival_time": "2026-03-10T14:30:00Z",
                "status": "Landed",
            },
        ]

    async def close(self):
        """Закриття клієнта."""
        await self.client.aclose()


class MaritimeAviationService:
    """Об'єднаний сервіс для морського та авіаційного моніторингу."""

    def __init__(self) -> None:
        self.marine_client = MarineTrafficClient()
        self.flight_client = FlightRadarClient()

    async def track_vessel(self, mmsi: str) -> Dict[str, Any]: # Властивості словника можуть бути довільними
        """Повне відстеження судна."""
        position = await self.marine_client.get_vessel_position(mmsi)
        info = await self.marine_client.get_vessel_info(mmsi)
        port_calls = await self.marine_client.get_port_calls(mmsi)

        return {
            "position": {
                "mmsi": position.mmsi if position else None,
                "name": position.name if position else None,
                "latitude": position.latitude if position else None,
                "longitude": position.longitude if position else None,
                "speed": position.speed if position else None,
                "course": position.course if position else None,
                "destination": position.destination if position else None,
            } if position else None,
            "info": {
                "imo": info.imo if info else None,
                "flag": info.flag if info else None,
                "vessel_type": info.vessel_type.value if info else None,
                "gross_tonnage": info.gross_tonnage if info else None,
                "owner": info.owner if info else None,
                "manager": info.manager if info else None,
            } if info else None,
            "port_calls": [
                {
                    "port": pc.port_name,
                    "country": pc.country,
                    "arrival": pc.arrival.isoformat() if pc.arrival else None,
                    "departure": pc.departure.isoformat() if pc.departure else None,
                }
                for pc in port_calls
            ],
        }

    async def track_aircraft(self, registration: str) -> Dict[str, Any]: # Властивості словника можуть бути довільними
        """Повне відстеження літака."""
        position = await self.flight_client.get_aircraft_position(registration)
        history = await self.flight_client.get_flight_history(registration)

        return {
            "position": {
                "registration": position.registration if position else None,
                "callsign": position.callsign if position else None,
                "aircraft_type": position.aircraft_type if position else None,
                "latitude": position.latitude if position else None,
                "longitude": position.longitude if position else None,
                "altitude": position.altitude if position else None,
                "speed": position.speed if position else None,
                "heading": position.heading if position else None,
                "origin": position.origin if position else None,
                "destination": position.destination if position else None,
                "on_ground": position.on_ground if position else None,
            } if position else None,
            "history": history[:10],  # Останні 10 польотів
        }

    async def search_area(
        self,
        lat_min: float,
        lat_max: float,
        lon_min: float,
        lon_max: float,
        include_vessels: bool = True,
        include_aircraft: bool = True,
    ) -> Dict[str, Any]: # Властивості словника можуть бути довільними
        """Пошук суден та літаків у заданому районі."""
        result: Dict[str, Any] = { # Властивості словника можуть бути довільними
            "bounds": {
                "lat_min": lat_min,
                "lat_max": lat_max,
                "lon_min": lon_min,
                "lon_max": lon_max,
            },
            "vessels": [],
            "aircraft": [],
        }

        if include_vessels:
            vessels = await self.marine_client.search_vessels_in_area(
                lat_min, lat_max, lon_min, lon_max
            )
            result["vessels"] = [
                {
                    "mmsi": v.mmsi,
                    "name": v.name,
                    "type": v.vessel_type.value,
                    "flag": v.flag,
                    "latitude": v.latitude,
                    "longitude": v.longitude,
                    "speed": v.speed,
                    "destination": v.destination,
                }
                for v in vessels
            ]

        if include_aircraft:
            aircraft = await self.flight_client.search_flights_in_area(
                lat_min, lat_max, lon_min, lon_max
            )
            result["aircraft"] = [
                {
                    "icao24": a.icao24,
                    "callsign": a.callsign,
                    "registration": a.registration,
                    "type": a.aircraft_type,
                    "latitude": a.latitude,
                    "longitude": a.longitude,
                    "altitude": a.altitude,
                    "speed": a.speed,
                    "origin": a.origin,
                    "destination": a.destination,
                }
                for a in aircraft
            ]

        return result

    async def close(self):
        """Закриття клієнтів."""
        await self.marine_client.close()
        await self.flight_client.close()
