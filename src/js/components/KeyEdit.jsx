import React, { useState, useEffect } from "react"
import { apiPostAny } from "../api.js"

import useApiResponse from "../hooks/ApiResponse.jsx"
import useUser from "../hooks/User.jsx"
import {useKey} from "../hooks/KeyGet.jsx"

import { makeStyles } from "@material-ui/core/styles"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import DialogTitle from "@material-ui/core/DialogTitle"
import FormControl from '@material-ui/core/FormControl'
import TextField from '@material-ui/core/TextField'
import Typography from "@material-ui/core/Typography"
import TextareaAutosize from "@material-ui/core/TextareaAutosize"

const useStyles = makeStyles(theme => ({
        formcontrol: {
                margin: theme.spacing(2, 0),
        },
	textarea: {
		fontFamily: "monospace",
		width: "100%",
		whiteSpace: "nowrap",
		overflow: "auto !important",
	},
}))

function KeyData(props) {
	const {value, setValue} = props
	const classes = useStyles()

	function handleTextChange(e) {
		setValue(e.target.value)
		console.log(e)
	}
	return (
		<TextareaAutosize
			className={classes.textarea}
			rowsMax={30}
			rowsMin={15}
			id="data"
			onChange={handleTextChange}
			value={value}
		/>
	)
}

function KeyEdit(props) {
	const {path, keyName} = props
	const { auth } = useUser()
	const [open, setOpen] = useState(false)
	const [value, setValue] = useKey({path: path, keyName: keyName})
        const [urlValue, setUrlValue] = useState("")
        const [fileValue, setFileValue] = useState("")
	const { dispatchAlerts } = useApiResponse()
	const classes = useStyles()
        const source = {
                "INPUT": "User Input",
                "LOCAL": "Local File",
                "REMOTE": "Remote Location",
        }
        const [active, setActive] = useState(source.INPUT)

        function handleOpen(e) {
                e.stopPropagation()
                setOpen(true)
        }
        function handleClose(e) {
                setOpen(false)
        }
        function handleSave(e) {
		apiPostAny("/key", {path: path, key: keyName, data: value}, (data) => {
			console.log(data)
			dispatchAlerts({data: data})
		}, auth)
                //setOpen(false)
        }
        function handleLoadFile(e) {
                if (active == source.LOCAL) {
                        console.log("fileValue", fileValue)
                        let file =  new File(fileValue, "foo", {
                                type: "text/plain",
                        })
                        let reader = new FileReader()
                        reader.onload = () => {
                                setValue(reader.result)
                                setActive(source.INPUT)
                        }
                        reader.readAsText(file)
                } else {
                        setActive(source.LOCAL)
                }
        }
        function handleLoadURL(e) {
                if (active == source.REMOTE) {
                        fetch(urlValue)
                                .then(res => res.text())
                                .then(buff => {
                                        setValue(buff)
                                        setActive(source.INPUT)
                                })
                } else {
                        setActive(source.REMOTE)
                }
        }

	return (
		<React.Fragment>
			<Button onClick={handleOpen} color="secondary">
				Edit
			</Button>
                        <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title" maxWidth="md" fullWidth={true}>
                                <DialogTitle id="form-dialog-title">{keyName}</DialogTitle>
                                <DialogContent>
					<KeyData value={value} setValue={setValue} />
                                        {(active==source.REMOTE) &&
                                        <FormControl className={classes.formcontrol} fullWidth>
                                                <TextField
                                                        label="Remote Location"
                                                        id="url"
                                                        type="url"
                                                        value={urlValue}
                                                        onChange={(e) => setUrlValue(e.target.value)}
                                                />
                                        </FormControl>
                                        }
                                        {(active==source.LOCAL) &&
                                        <FormControl className={classes.formcontrol} fullWidth>
                                                <TextField
                                                        label="File"
                                                        id="file"
                                                        type="file"
                                                        onChange={(e) => setFileValue(e.target.files)}
                                                />
                                        </FormControl>
                                        }
                                </DialogContent>
                                <DialogActions>
                                        <Button onClick={handleLoadURL} color={(active == source.REMOTE) ? "secondary" : "primary"}>
                                                Load URL
                                        </Button>
                                        <Button onClick={handleLoadFile} color={(active == source.LOCAL) ? "secondary" : "primary"}>
                                                Load File
                                        </Button>
                                        <Button onClick={handleClose} color="primary">
                                                Dismiss
                                        </Button>
                                        <Button onClick={handleSave} color="secondary">
                                                Save
                                        </Button>
                                </DialogActions>
                        </Dialog>
		</React.Fragment>
	)
}

export {
	KeyEdit,
}
