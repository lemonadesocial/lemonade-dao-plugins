import {
  ProposalIntervened as ProposalIntervenedEvent,
  ParentSet as ParentSetEvent,
  ParentUnset as ParentUnsetEvent,
  Deactivated as DeactivatedEvent
} from "../generated/ParentChildPlugin/ParentChildPlugin"
import { ProposalIntervened, ParentSet, ParentUnset, Deactivated } from "../generated/schema"

export function handleProposalIntervened(event: ProposalIntervenedEvent): void {
  let entity = new ProposalIntervened(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.proposalId = event.params.proposalId
  entity.rejected = event.params.rejected

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleParentSet(event: ParentSetEvent): void {
  let entity = new ParentSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.parent = event.params.parent
  entity.child = event.params.child
  entity.hardLink = event.params.hardLink

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleParentUnset(event: ParentUnsetEvent): void {
  let entity = new ParentUnset(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.parent = event.params.parent
  entity.child = event.params.child

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDeactivated(event: DeactivatedEvent): void {
  let entity = new Deactivated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
