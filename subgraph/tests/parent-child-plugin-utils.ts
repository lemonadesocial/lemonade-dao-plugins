import { newMockEvent } from "matchstick-as";
import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  Deactivated,
  ParentSet,
  ParentUnset,
  ProposalIntervened,
} from "../generated/ParentChildPlugin/ParentChildPlugin";

export function createProposalIntervenedEvent(
  proposalId: Bytes,
  rejected: boolean,
): ProposalIntervened {
  let proposalIntervenedEvent = changetype<ProposalIntervened>(newMockEvent());

  proposalIntervenedEvent.parameters = new Array();

  proposalIntervenedEvent.parameters.push(
    new ethereum.EventParam(
      "proposalId",
      ethereum.Value.fromBytes(proposalId),
    ),
  );
  proposalIntervenedEvent.parameters.push(
    new ethereum.EventParam("rejected", ethereum.Value.fromBoolean(rejected)),
  );

  return proposalIntervenedEvent;
}

export function createParentSetEvent(
  parent: Address,
  child: Address,
  hardLink: boolean,
): ParentSet {
  let parentSetEvent = changetype<ParentSet>(newMockEvent());

  parentSetEvent.parameters = new Array();

  parentSetEvent.parameters.push(
    new ethereum.EventParam("parent", ethereum.Value.fromAddress(parent)),
  );

  parentSetEvent.parameters.push(
    new ethereum.EventParam("child", ethereum.Value.fromAddress(child)),
  );

  parentSetEvent.parameters.push(
    new ethereum.EventParam(
      "hardLink",
      ethereum.Value.fromBoolean(hardLink),
    ),
  );

  return parentSetEvent;
}

export function createParentUnsetEvent(
  parent: Address,
  child: Address,
): ParentUnset {
  let parentUnsetEvent = changetype<ParentUnset>(newMockEvent());

  parentUnsetEvent.parameters = new Array();

  parentUnsetEvent.parameters.push(
    new ethereum.EventParam(
      "parent",
      ethereum.Value.fromAddress(parent),
    ),
  );

  parentUnsetEvent.parameters.push(
    new ethereum.EventParam(
      "child",
      ethereum.Value.fromAddress(child),
    ),
  );

  return parentUnsetEvent;
}

export function createDeactivatedEvent(): Deactivated {
  let deactivatedEvent = changetype<Deactivated>(newMockEvent());

  deactivatedEvent.parameters = new Array();

  return deactivatedEvent;
}
