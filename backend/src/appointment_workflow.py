"""
Appointment Booking Workflow using Microsoft Agent Framework Workflows.

This module implements a deterministic, type-safe workflow for appointment booking
with Human-in-the-Loop (HITL) approval at critical decision points.

Workflow Steps:
1. FetchAppointments: Generate available appointment slots
2. ValidateSelection: Validate user-selected appointment (HITL)
3. ConfirmAppointment: Finalize booking after approval

State transitions are explicitly defined via edges, ensuring predictable execution.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, validator

logger = logging.getLogger(__name__)


# ============================================================================
# WORKFLOW STATE MODELS (Type-Safe with Pydantic)
# ============================================================================

class WorkflowState(str, Enum):
    """Appointment workflow states."""
    IDLE = "idle"
    FETCHING = "fetching"
    AWAITING_SELECTION = "awaiting_selection"
    VALIDATING = "validating"
    CONFIRMING = "confirming"
    COMPLETED = "completed"
    FAILED = "failed"


class AppointmentData(BaseModel):
    """Single appointment slot."""
    id: str = Field(..., description="Unique appointment ID")
    datum: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Date in YYYY-MM-DD format")
    uhrzeit: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="Time in HH:MM format")
    verfuegbar: bool = Field(default=True, description="Availability status")
    
    @validator('uhrzeit')
    def validate_time(cls, v):
        """Ensure time is valid."""
        try:
            datetime.strptime(v, "%H:%M")
            return v
        except ValueError:
            raise ValueError(f"Invalid time format: {v}")


class AdvisorInfo(BaseModel):
    """Bank advisor information."""
    name: str = Field(default="Michael Weber")
    title: str = Field(default="Senior Bankberater")
    avatarUrl: str = Field(default="/advisor-avatar.svg")


class AppointmentSelection(BaseModel):
    """User's appointment selection."""
    termin_id: Optional[str] = None
    datum: Optional[str] = None
    uhrzeit: Optional[str] = None
    selected: bool = False
    
    def is_valid(self) -> bool:
        """Check if selection has required fields."""
        return bool(self.selected and self.termin_id and self.datum and self.uhrzeit)


class WorkflowContext(BaseModel):
    """Complete workflow context with state and data."""
    state: WorkflowState = Field(default=WorkflowState.IDLE)
    appointments: List[AppointmentData] = Field(default_factory=list)
    advisor: AdvisorInfo = Field(default_factory=AdvisorInfo)
    selection: Optional[AppointmentSelection] = None
    error: Optional[str] = None
    
    # Metadata
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        use_enum_values = True


# ============================================================================
# WORKFLOW EXECUTORS (Business Logic Components)
# ============================================================================

class FetchAppointmentsExecutor:
    """
    Executor 1: Fetch/Generate available appointment slots.
    
    This executor generates mock appointments for the next 2 weeks.
    In production, this would call an external API.
    """
    
    def __init__(self, num_appointments: int = 10):
        self.num_appointments = num_appointments
    
    def execute(self, context: WorkflowContext) -> WorkflowContext:
        """Generate appointment slots and update context."""
        logger.info("🔍 FetchAppointmentsExecutor: Generating appointments...")
        
        try:
            context.state = WorkflowState.FETCHING
            context.started_at = datetime.now()
            
            # Generate appointments
            appointments = self._generate_appointments()
            context.appointments = [AppointmentData(**apt) for apt in appointments]
            
            # Transition to awaiting selection
            context.state = WorkflowState.AWAITING_SELECTION
            
            logger.info(f"✅ Generated {len(context.appointments)} appointments")
            return context
            
        except Exception as e:
            logger.error(f"❌ FetchAppointmentsExecutor failed: {e}")
            context.state = WorkflowState.FAILED
            context.error = str(e)
            return context
    
    def _generate_appointments(self) -> List[Dict[str, Any]]:
        """Generate realistic appointment slots (Mon-Fri, 9:00-17:30)."""
        appointments = []
        appointment_times = [
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
            "16:00", "16:30", "17:00", "17:30"
        ]
        
        current_date = datetime.now() + timedelta(days=1)
        appointment_id = 1
        
        while len(appointments) < self.num_appointments:
            if current_date.weekday() < 5:  # Mon-Fri only
                time_idx = (len(appointments) % len(appointment_times))
                uhrzeit = appointment_times[time_idx]
                
                appointments.append({
                    "id": f"apt_{appointment_id:03d}",
                    "datum": current_date.strftime("%Y-%m-%d"),
                    "uhrzeit": uhrzeit,
                    "verfuegbar": True
                })
                appointment_id += 1
            
            current_date += timedelta(days=1)
        
        return appointments


class ValidateSelectionExecutor:
    """
    Executor 2: Validate user's appointment selection (HITL).
    
    This executor performs strict validation:
    - Checks if termin_id exists in generated appointments
    - Validates datum + uhrzeit match the appointment exactly
    - Enforces type safety via Pydantic models
    """
    
    def execute(self, context: WorkflowContext, selection: AppointmentSelection) -> WorkflowContext:
        """Validate user selection against available appointments."""
        logger.info(f"🔍 ValidateSelectionExecutor: Validating selection {selection.dict()}")
        
        try:
            context.state = WorkflowState.VALIDATING
            context.selection = selection
            
            # Pre-check: Selection must have required fields
            if not selection.is_valid():
                raise ValueError("Selection missing required fields (termin_id, datum, uhrzeit)")
            
            # Find matching appointment
            matching_apt = self._find_matching_appointment(
                context.appointments,
                selection.termin_id,
                selection.datum,
                selection.uhrzeit
            )
            
            if not matching_apt:
                valid_slots = [f"{apt.datum} um {apt.uhrzeit}" for apt in context.appointments[:3]]
                raise ValueError(
                    f"Ungültiger Termin: {selection.datum} um {selection.uhrzeit}. "
                    f"Verfügbare Termine: {', '.join(valid_slots)}..."
                )
            
            # Validation successful - move to confirming
            context.state = WorkflowState.CONFIRMING
            logger.info(f"✅ Validation passed: {matching_apt.id} ({matching_apt.datum} {matching_apt.uhrzeit})")
            return context
            
        except ValueError as e:
            logger.warning(f"⚠️ Validation failed: {e}")
            context.state = WorkflowState.AWAITING_SELECTION  # Return to selection state
            context.error = str(e)
            context.selection = None  # Clear invalid selection
            return context
        except Exception as e:
            logger.error(f"❌ ValidateSelectionExecutor unexpected error: {e}")
            context.state = WorkflowState.FAILED
            context.error = str(e)
            return context
    
    def _find_matching_appointment(
        self,
        appointments: List[AppointmentData],
        termin_id: Optional[str],
        datum: Optional[str],
        uhrzeit: Optional[str]
    ) -> Optional[AppointmentData]:
        """Find appointment matching both ID and datetime."""
        for apt in appointments:
            # Match by termin_id (primary)
            if termin_id and apt.id == termin_id:
                # Additional validation: datum + uhrzeit must match
                if datum and uhrzeit:
                    if apt.datum == datum and apt.uhrzeit == uhrzeit:
                        return apt
                    else:
                        logger.warning(
                            f"termin_id {termin_id} found, but datetime mismatch: "
                            f"expected {apt.datum} {apt.uhrzeit}, got {datum} {uhrzeit}"
                        )
                        return None
                else:
                    return apt
            
            # Fallback: Match by datum + uhrzeit only (verbal selection)
            if datum and uhrzeit:
                if apt.datum == datum and apt.uhrzeit == uhrzeit:
                    return apt
        
        return None


class ConfirmAppointmentExecutor:
    """
    Executor 3: Finalize appointment booking.
    
    This executor would integrate with external booking systems.
    For now, it marks the workflow as completed.
    """
    
    def execute(self, context: WorkflowContext) -> WorkflowContext:
        """Confirm and finalize appointment booking."""
        logger.info("✅ ConfirmAppointmentExecutor: Finalizing booking...")
        
        try:
            if not context.selection or not context.selection.is_valid():
                raise ValueError("No valid selection to confirm")
            
            # In production: Call external API to book appointment
            # result = await external_api.book_appointment(context.selection)
            
            context.state = WorkflowState.COMPLETED
            context.completed_at = datetime.now()
            
            logger.info(
                f"🎉 Appointment confirmed: {context.selection.termin_id} "
                f"({context.selection.datum} {context.selection.uhrzeit})"
            )
            return context
            
        except Exception as e:
            logger.error(f"❌ ConfirmAppointmentExecutor failed: {e}")
            context.state = WorkflowState.FAILED
            context.error = str(e)
            return context


# ============================================================================
# WORKFLOW ORCHESTRATOR
# ============================================================================

class AppointmentWorkflow:
    """
    Orchestrator for the appointment booking workflow.
    
    This implements a simplified workflow pattern inspired by Microsoft Agent Framework.
    Full framework integration would use actual Workflow graphs with edges.
    
    States:
    - IDLE → FETCHING → AWAITING_SELECTION → VALIDATING → CONFIRMING → COMPLETED
    - VALIDATING → AWAITING_SELECTION (on validation failure - retry loop)
    - Any state → FAILED (on unexpected errors)
    """
    
    def __init__(self):
        self.fetch_executor = FetchAppointmentsExecutor()
        self.validate_executor = ValidateSelectionExecutor()
        self.confirm_executor = ConfirmAppointmentExecutor()
    
    def start_workflow(self) -> WorkflowContext:
        """Initialize and start the workflow - fetch appointments."""
        logger.info("🚀 Starting appointment workflow...")
        context = WorkflowContext()
        return self.fetch_executor.execute(context)
    
    def process_selection(self, context: WorkflowContext, selection_data: Dict[str, Any]) -> WorkflowContext:
        """
        Process user's appointment selection (HITL step).
        
        Args:
            context: Current workflow context
            selection_data: User selection from frontend
            
        Returns:
            Updated context after validation
        """
        logger.info(f"📥 Processing user selection: {selection_data}")
        
        # Validate current state
        if context.state != WorkflowState.AWAITING_SELECTION:
            logger.warning(f"⚠️ Cannot process selection in state {context.state}")
            context.error = f"Invalid workflow state for selection: {context.state}"
            return context
        
        # Parse and validate selection
        try:
            selection = AppointmentSelection(**selection_data)
        except Exception as e:
            logger.error(f"❌ Invalid selection format: {e}")
            context.error = f"Ungültige Auswahl: {e}"
            return context
        
        # Run validation executor
        context = self.validate_executor.execute(context, selection)
        
        # If validation passed, automatically move to confirmation
        if context.state == WorkflowState.CONFIRMING:
            context = self.confirm_executor.execute(context)
        
        return context
    
    def get_state(self, context: WorkflowContext) -> Dict[str, Any]:
        """Get current workflow state for frontend."""
        return {
            "state": context.state,
            "appointments": [apt.dict() for apt in context.appointments] if context.appointments else [],
            "advisor": context.advisor.dict(),
            "selection": context.selection.dict() if context.selection else None,
            "error": context.error,
            "completed": context.state == WorkflowState.COMPLETED
        }
    
    def should_show_ui(self, context: WorkflowContext) -> bool:
        """Determine if UI modal should be shown."""
        return context.state == WorkflowState.AWAITING_SELECTION
    
    def is_complete(self, context: WorkflowContext) -> bool:
        """Check if workflow is complete."""
        return context.state in [WorkflowState.COMPLETED, WorkflowState.FAILED]


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def create_appointment_workflow() -> AppointmentWorkflow:
    """Factory function to create a new workflow instance."""
    return AppointmentWorkflow()


def serialize_context(context: WorkflowContext) -> str:
    """Serialize workflow context to JSON for storage."""
    return context.json()


def deserialize_context(json_str: str) -> WorkflowContext:
    """Deserialize workflow context from JSON."""
    return WorkflowContext.parse_raw(json_str)
