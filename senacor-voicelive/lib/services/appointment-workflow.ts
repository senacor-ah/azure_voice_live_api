/**
 * Appointment Booking Workflow
 * Migrated from: backend/src/appointment_workflow.py
 *
 * Implements a deterministic, type-safe workflow for appointment booking
 * with Human-in-the-Loop (HITL) approval at critical decision points.
 *
 * Workflow Steps:
 * 1. FetchAppointments: Generate available appointment slots
 * 2. ValidateSelection: Validate user-selected appointment (HITL)
 * 3. ConfirmAppointment: Finalize booking after approval
 */

import {
  WorkflowState,
  AppointmentData,
  AppointmentSelection,
  AppointmentSelectionSchema,
  WorkflowContext,
  AdvisorInfo,
} from '@/lib/types/voice'

// ============================================================================
// Helper: Check if selection is valid
// ============================================================================

function isSelectionValid(selection: AppointmentSelection): boolean {
  return Boolean(selection.selected && selection.termin_id && selection.datum && selection.uhrzeit)
}

// ============================================================================
// WORKFLOW EXECUTORS (Business Logic Components)
// ============================================================================

/**
 * Executor 1: Fetch/Generate available appointment slots.
 * In production, this would call an external API.
 */
class FetchAppointmentsExecutor {
  private numAppointments: number

  constructor(numAppointments = 10) {
    this.numAppointments = numAppointments
  }

  execute(context: WorkflowContext): WorkflowContext {
    console.log('🔍 FetchAppointmentsExecutor: Generating appointments...')

    try {
      context.state = WorkflowState.FETCHING
      context.started_at = new Date().toISOString()

      // Generate appointments
      const appointments = this.generateAppointments()
      context.appointments = appointments

      // Transition to awaiting selection
      context.state = WorkflowState.AWAITING_SELECTION

      console.log(`✅ Generated ${context.appointments.length} appointments`)
      return context
    } catch (e) {
      console.error(`❌ FetchAppointmentsExecutor failed: ${e}`)
      context.state = WorkflowState.FAILED
      context.error = String(e)
      return context
    }
  }

  private generateAppointments(): AppointmentData[] {
    const appointments: AppointmentData[] = []
    const appointmentTimes = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30',
    ]

    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() + 1) // Start from tomorrow
    let appointmentId = 1

    while (appointments.length < this.numAppointments) {
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Mon-Fri only
        const timeIdx = appointments.length % appointmentTimes.length
        const uhrzeit = appointmentTimes[timeIdx]

        appointments.push({
          id: `apt_${String(appointmentId).padStart(3, '0')}`,
          datum: currentDate.toISOString().split('T')[0],
          uhrzeit,
          verfuegbar: true,
        })
        appointmentId++
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return appointments
  }
}

/**
 * Executor 2: Validate user's appointment selection (HITL).
 *
 * Performs strict validation:
 * - Checks if termin_id exists in generated appointments
 * - Validates datum + uhrzeit match the appointment exactly
 */
class ValidateSelectionExecutor {
  execute(context: WorkflowContext, selection: AppointmentSelection): WorkflowContext {
    console.log(`🔍 ValidateSelectionExecutor: Validating selection`, selection)

    try {
      context.state = WorkflowState.VALIDATING
      context.selection = selection

      // Pre-check: Selection must have required fields
      if (!isSelectionValid(selection)) {
        throw new Error('Selection missing required fields (termin_id, datum, uhrzeit)')
      }

      // Find matching appointment
      const matchingApt = this.findMatchingAppointment(
        context.appointments,
        selection.termin_id ?? undefined,
        selection.datum ?? undefined,
        selection.uhrzeit ?? undefined,
      )

      if (!matchingApt) {
        const validSlots = context.appointments
          .slice(0, 3)
          .map((apt) => `${apt.datum} um ${apt.uhrzeit}`)
        throw new Error(
          `Ungültiger Termin: ${selection.datum} um ${selection.uhrzeit}. ` +
          `Verfügbare Termine: ${validSlots.join(', ')}...`,
        )
      }

      // Validation successful - move to confirming
      context.state = WorkflowState.CONFIRMING
      console.log(`✅ Validation passed: ${matchingApt.id} (${matchingApt.datum} ${matchingApt.uhrzeit})`)
      return context
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Ungültiger') || e instanceof Error && e.message.startsWith('Selection')) {
        console.warn(`⚠️ Validation failed: ${e}`)
        context.state = WorkflowState.AWAITING_SELECTION // Return to selection state
        context.error = String(e instanceof Error ? e.message : e)
        context.selection = null
        return context
      }
      console.error(`❌ ValidateSelectionExecutor unexpected error: ${e}`)
      context.state = WorkflowState.FAILED
      context.error = String(e)
      return context
    }
  }

  private findMatchingAppointment(
    appointments: AppointmentData[],
    terminId?: string,
    datum?: string,
    uhrzeit?: string,
  ): AppointmentData | null {
    for (const apt of appointments) {
      // Match by termin_id (primary)
      if (terminId && apt.id === terminId) {
        // Additional validation: datum + uhrzeit must match
        if (datum && uhrzeit) {
          if (apt.datum === datum && apt.uhrzeit === uhrzeit) {
            return apt
          } else {
            console.warn(
              `termin_id ${terminId} found, but datetime mismatch: ` +
              `expected ${apt.datum} ${apt.uhrzeit}, got ${datum} ${uhrzeit}`,
            )
            return null
          }
        } else {
          return apt
        }
      }

      // Fallback: Match by datum + uhrzeit only (verbal selection)
      if (datum && uhrzeit) {
        if (apt.datum === datum && apt.uhrzeit === uhrzeit) {
          return apt
        }
      }
    }

    return null
  }
}

/**
 * Executor 3: Finalize appointment booking.
 * In production, this would integrate with external booking systems.
 */
class ConfirmAppointmentExecutor {
  execute(context: WorkflowContext): WorkflowContext {
    console.log('✅ ConfirmAppointmentExecutor: Finalizing booking...')

    try {
      if (!context.selection || !isSelectionValid(context.selection)) {
        throw new Error('No valid selection to confirm')
      }

      // In production: Call external API to book appointment
      context.state = WorkflowState.COMPLETED
      context.completed_at = new Date().toISOString()

      console.log(
        `🎉 Appointment confirmed: ${context.selection.termin_id} ` +
        `(${context.selection.datum} ${context.selection.uhrzeit})`,
      )
      return context
    } catch (e) {
      console.error(`❌ ConfirmAppointmentExecutor failed: ${e}`)
      context.state = WorkflowState.FAILED
      context.error = String(e)
      return context
    }
  }
}

// ============================================================================
// WORKFLOW ORCHESTRATOR
// ============================================================================

/**
 * Orchestrator for the appointment booking workflow.
 *
 * States:
 * - IDLE → FETCHING → AWAITING_SELECTION → VALIDATING → CONFIRMING → COMPLETED
 * - VALIDATING → AWAITING_SELECTION (on validation failure - retry loop)
 * - Any state → FAILED (on unexpected errors)
 */
export class AppointmentWorkflow {
  private fetchExecutor: FetchAppointmentsExecutor
  private validateExecutor: ValidateSelectionExecutor
  private confirmExecutor: ConfirmAppointmentExecutor

  constructor() {
    this.fetchExecutor = new FetchAppointmentsExecutor()
    this.validateExecutor = new ValidateSelectionExecutor()
    this.confirmExecutor = new ConfirmAppointmentExecutor()
  }

  /** Initialize and start the workflow - fetch appointments. */
  startWorkflow(): WorkflowContext {
    console.log('🚀 Starting appointment workflow...')
    const context: WorkflowContext = {
      state: WorkflowState.IDLE,
      appointments: [],
      advisor: { name: 'Michael Weber', title: 'Senior Bankberater', avatarUrl: '/advisor-avatar.svg' },
      selection: null,
      error: null,
      started_at: null,
      completed_at: null,
    }
    return this.fetchExecutor.execute(context)
  }

  /**
   * Process user's appointment selection (HITL step).
   */
  processSelection(context: WorkflowContext, selectionData: Record<string, unknown>): WorkflowContext {
    console.log(`📥 Processing user selection:`, selectionData)

    // Validate current state
    if (context.state !== WorkflowState.AWAITING_SELECTION) {
      console.warn(`⚠️ Cannot process selection in state ${context.state}`)
      context.error = `Invalid workflow state for selection: ${context.state}`
      return context
    }

    // Parse and validate selection
    const parsed = AppointmentSelectionSchema.safeParse(selectionData)
    if (!parsed.success) {
      console.error(`❌ Invalid selection format:`, parsed.error)
      context.error = `Ungültige Auswahl: ${parsed.error.message}`
      return context
    }

    const selection = parsed.data

    // Run validation executor
    context = this.validateExecutor.execute(context, selection)

    // If validation passed, automatically move to confirmation
    if (context.state === WorkflowState.CONFIRMING) {
      context = this.confirmExecutor.execute(context)
    }

    return context
  }

  /** Get current workflow state for frontend. */
  getState(context: WorkflowContext): Record<string, unknown> {
    return {
      state: context.state,
      appointments: context.appointments ?? [],
      advisor: context.advisor,
      selection: context.selection ?? null,
      error: context.error,
      completed: context.state === WorkflowState.COMPLETED,
    }
  }

  /** Determine if UI modal should be shown. */
  shouldShowUi(context: WorkflowContext): boolean {
    return context.state === WorkflowState.AWAITING_SELECTION
  }

  /** Check if workflow is complete. */
  isComplete(context: WorkflowContext): boolean {
    return context.state === WorkflowState.COMPLETED || context.state === WorkflowState.FAILED
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/** Factory function to create a new workflow instance. */
export function createAppointmentWorkflow(): AppointmentWorkflow {
  return new AppointmentWorkflow()
}

/** Serialize workflow context to JSON string for storage. */
export function serializeContext(context: WorkflowContext): string {
  return JSON.stringify(context)
}

/** Deserialize workflow context from JSON string. */
export function deserializeContext(jsonStr: string): WorkflowContext {
  return JSON.parse(jsonStr) as WorkflowContext
}
